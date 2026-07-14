import crypto from "node:crypto";
import { getEnv } from "../env.js";
import { log } from "../logger.js";
import { getClient, consumeAuthCode } from "./oauth/codes.js";
import {
  type McpRole,
  signMcpToken,
  signMcpRefreshToken,
  verifyMcpRefreshToken,
  MCP_REFRESH_TTL_SECONDS,
} from "./issuer.js";
import { callBackend } from "./index.js";

const env = getEnv();

// ---------------------------------------------------------------------------
// CORS helper (lets the app / any harness call the /token endpoint)
// ---------------------------------------------------------------------------
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsResponse(body: Response | null): Response {
  if (!body) {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    body.headers.set(k, v);
  }
  return body;
}

function jsonError(
  error: string,
  error_description: string,
  status: number,
): Response {
  return new Response(
    JSON.stringify({ error, error_description }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function tokenResponse(access_token: string, refresh_token: string): Response {
  return new Response(
    JSON.stringify({
      access_token,
      token_type: "Bearer",
      expires_in: env.MCP_TOKEN_TTL,
      refresh_token,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// ---------------------------------------------------------------------------
// OAuth 2.0 Token endpoint (grant handler)
//   - grant_type=authorization_code  → PKCE-bound auth code exchange
//   - grant_type=refresh_token       → rotate and issue a new access token
// Both grants mint an MCP JWT Bearer (HS256) access token plus a refresh token
// that is persisted (revocation-capable) in the backend.
// ---------------------------------------------------------------------------
export async function handleTokenGrant(req: Request): Promise<Response> {
  let params: Record<string, string> = {};
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      params = (await req.json()) as Record<string, string>;
    } else {
      const form = new URLSearchParams(await req.text());
      for (const [k, v] of form.entries()) params[k] = v;
    }
  } catch {
    return jsonError("invalid_request", "Bad body", 400);
  }

  const grantType = params.grant_type;

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(params);
  }
  if (grantType === "refresh_token") {
    return handleRefreshToken(params);
  }

  return jsonError(
    "unsupported_grant_type",
    "Supported: authorization_code, refresh_token",
    400,
  );
}

// ---------------------------------------------------------------------------
// authorization_code grant (RFC 6749 + PKCE RFC 7636)
// ---------------------------------------------------------------------------
async function handleAuthorizationCode(
  params: Record<string, string>,
): Promise<Response> {
  const clientId = params.client_id ?? "";
  const code = params.code ?? "";
  const codeVerifier = params.code_verifier ?? "";
  const redirectUri = params.redirect_uri ?? "";

  // 1. The client must be a registered public client.
  if (!clientId) {
    return jsonError("invalid_client", "client_id is required", 400);
  }
  const client = await getClient(clientId);
  if (!client) {
    log("warn", "token_grant_failed", {
      grant: "authorization_code",
      reason: "unknown_client",
    });
    return jsonError("invalid_client", "Unknown client_id", 400);
  }

  // 2. The auth code must exist, be unexpired, and match the client.
  const rec = consumeAuthCode(code);
  if (!rec) {
    log("warn", "token_grant_failed", {
      grant: "authorization_code",
      reason: "bad_or_expired_code",
    });
    return jsonError("invalid_grant", "Authorization code invalid", 400);
  }
  if (rec.client_id !== clientId) {
    log("warn", "token_grant_failed", {
      grant: "authorization_code",
      reason: "client_mismatch",
    });
    return jsonError("invalid_grant", "client_id mismatch", 400);
  }
  if (redirectUri && rec.redirect_uri !== redirectUri) {
    log("warn", "token_grant_failed", {
      grant: "authorization_code",
      reason: "redirect_uri_mismatch",
    });
    return jsonError("invalid_grant", "redirect_uri mismatch", 400);
  }

  // 3. PKCE: S256(code_verifier) must match the stored code_challenge.
  const verifier = Buffer.from(codeVerifier);
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const expected = Buffer.from(rec.code_challenge);
  if (
    verifier.length === 0 ||
    expected.length !== challenge.length ||
    !crypto.timingSafeEqual(Buffer.from(challenge), expected)
  ) {
    log("warn", "token_grant_failed", {
      grant: "authorization_code",
      reason: "pkce_mismatch",
    });
    return jsonError("invalid_grant", "PKCE verification failed", 400);
  }

  // 4. Mint the access + refresh tokens.
  const role = rec.role;
  const accessToken = signMcpToken({ userId: rec.userId, role });
  const refreshToken = signMcpRefreshToken({
    clientId,
    userId: rec.userId,
    role,
  });

  const refreshExpiresAt = new Date(
    (Math.floor(Date.now() / 1000) + MCP_REFRESH_TTL_SECONDS) * 1000,
  ).toISOString();
  const persist = await callBackend("/api/mcp/oauth/refresh", {
    method: "POST",
    body: {
      token: refreshToken,
      clientId,
      userId: rec.userId,
      role,
      expiresAt: refreshExpiresAt,
    },
    timeout: 10000,
  });
  if (!persist.ok) {
    log("error", "refresh_persist_failed", {
      grant: "authorization_code",
      status: persist.status,
    });
    return jsonError("server_error", "Failed to persist refresh token", 500);
  }

  log("info", "token_issued", {
    grant: "authorization_code",
    userId: rec.userId,
    role,
  });
  return tokenResponse(accessToken, refreshToken);
}

// ---------------------------------------------------------------------------
// refresh_token grant (rotation)
// ---------------------------------------------------------------------------
async function handleRefreshToken(
  params: Record<string, string>,
): Promise<Response> {
  const refreshToken = params.refresh_token ?? "";
  if (!refreshToken) {
    return jsonError("invalid_request", "refresh_token is required", 400);
  }

  const claims = verifyMcpRefreshToken(refreshToken);
  if (!claims) {
    log("warn", "token_grant_failed", {
      grant: "refresh_token",
      reason: "invalid_or_expired",
    });
    return jsonError("invalid_grant", "Refresh token invalid or expired", 400);
  }

  // Check the refresh token hasn't been revoked / rotated away.
  const lookup = await callBackend(
    `/api/mcp/oauth/refresh?token=${encodeURIComponent(refreshToken)}`,
    { method: "GET", timeout: 10000 },
  );
  if (!lookup.ok) {
    log("warn", "token_grant_failed", {
      grant: "refresh_token",
      reason: "revoked",
    });
    return jsonError("invalid_grant", "Refresh token revoked", 400);
  }

  const { sub: userId, role, clientId } = claims;

  // Mint a fresh access token (role may legitimately stay as issued).
  const accessToken = signMcpToken({ userId, role: role as McpRole });

  // Rotate the refresh token: revoke the old, persist the new.
  const newRefresh = signMcpRefreshToken({
    clientId,
    userId,
    role: role as McpRole,
  });
  const refreshExpiresAt = new Date(
    (Math.floor(Date.now() / 1000) + MCP_REFRESH_TTL_SECONDS) * 1000,
  ).toISOString();

  await callBackend(
    `/api/mcp/oauth/refresh?token=${encodeURIComponent(refreshToken)}`,
    { method: "DELETE", timeout: 10000 },
  );
  const persist = await callBackend("/api/mcp/oauth/refresh", {
    method: "POST",
    body: {
      token: newRefresh,
      clientId,
      userId,
      role,
      expiresAt: refreshExpiresAt,
    },
    timeout: 10000,
  });
  if (!persist.ok) {
    log("error", "refresh_persist_failed", {
      grant: "refresh_token",
      status: persist.status,
    });
    return jsonError("server_error", "Failed to persist refresh token", 500);
  }

  log("info", "token_issued", {
    grant: "refresh_token",
    userId,
    role,
  });
  return tokenResponse(accessToken, newRefresh);
}
