import { createClerkClient } from "@clerk/backend";
import { getEnv } from "../../env.js";
import { verifyClerkJwt } from "../index.js";
import type { McpRole } from "../issuer.js";
import { resolveClerkRole } from "../issuer.js";
import { generateAuthCode, getClient } from "./codes.js";

const env = getEnv();
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// Frontend base URL for the consent page. Read from env; a safe default is used
// only as a last-resort fallback when FRONTEND_URL is not configured.
const FRONTEND_URL = env.FRONTEND_URL ?? "https://dolce-atelier-chi.vercel.app";

function buildErrorRedirect(
  redirectUri: string,
  error: string,
  state?: string | null,
): Response {
  const params = new URLSearchParams({ error });
  if (state) params.set("state", state);
  return new Response(null, {
    status: 302,
    headers: { Location: `${redirectUri}?${params.toString()}` },
  });
}

// ---------------------------------------------------------------------------
// GET /authorize — standard OAuth 2.0 authorization endpoint.
// Validates the request and redirects the browser to the frontend consent
// page, carrying the OAuth params along.
// ---------------------------------------------------------------------------
export async function handleAuthorize(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams;

  const client_id = q.get("client_id");
  const redirect_uri = q.get("redirect_uri");
  const response_type = q.get("response_type");
  const scope = q.get("scope");
  const state = q.get("state");
  const code_challenge = q.get("code_challenge");
  const code_challenge_method = q.get("code_challenge_method");

  // response_type must be "code"
  if (response_type !== "code") {
    return json(
      {
        error: "unsupported_response_type",
        error_description: "response_type must be 'code'",
      },
      400,
    );
  }

  if (!client_id || !redirect_uri) {
    return json(
      {
        error: "invalid_request",
        error_description: "client_id and redirect_uri are required",
      },
      400,
    );
  }

  // Validate client exists
  const client = await getClient(client_id);
  if (!client) {
    return buildErrorRedirect(redirect_uri, "unauthorized_client", state);
  }

  // Validate redirect_uri is registered
  if (!client.redirect_uris.includes(redirect_uri)) {
    return buildErrorRedirect(redirect_uri, "invalid_redirect_uri", state);
  }

  // Validate PKCE
  if (!code_challenge) {
    return buildErrorRedirect(redirect_uri, "invalid_request", state);
  }
  if (code_challenge_method !== "S256") {
    return buildErrorRedirect(redirect_uri, "invalid_request", state);
  }

  // Redirect to the frontend consent page with the same OAuth params.
  const params = new URLSearchParams();
  params.set("client_id", client_id);
  params.set("redirect_uri", redirect_uri);
  if (state) params.set("state", state);
  if (scope) params.set("scope", scope);
  if (code_challenge) params.set("code_challenge", code_challenge);
  if (code_challenge_method)
    params.set("code_challenge_method", code_challenge_method);

  let base = FRONTEND_URL;
  while (base.endsWith("/")) base = base.slice(0, -1);
  return new Response(null, {
    status: 302,
    headers: { Location: `${base}/mcp-authorize?${params.toString()}` },
  });
}

// ---------------------------------------------------------------------------
// POST /authorize/approve — called by the frontend after the user consents.
// Verifies the Clerk session token, then issues an authorization code.
// ---------------------------------------------------------------------------
export async function handleApprove(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(
      { error: "invalid_request", error_description: "Bad JSON body" },
      400,
    );
  }

  const clerk_token =
    typeof body.clerk_token === "string" ? body.clerk_token : null;
  const client_id = typeof body.client_id === "string" ? body.client_id : null;
  const redirect_uri =
    typeof body.redirect_uri === "string" ? body.redirect_uri : null;
  const state = typeof body.state === "string" ? body.state : null;
  const code_challenge =
    typeof body.code_challenge === "string" ? body.code_challenge : null;

  if (!clerk_token || !client_id || !redirect_uri || !code_challenge) {
    return json(
      {
        error: "invalid_request",
        error_description:
          "clerk_token, client_id, redirect_uri and code_challenge are required",
      },
      400,
    );
  }

  // Verify the Clerk session token.
  const userId = await verifyClerkJwt(`Bearer ${clerk_token}`);
  if (!userId) {
    return json(
      { error: "invalid_grant", error_description: "Clerk token inválido" },
      401,
    );
  }

  // Resolve role from Clerk public metadata (admin/superadmin else user).
  let role: McpRole = "user";
  try {
    const user = await clerkClient.users.getUser(userId);
    role = resolveClerkRole(user);
  } catch {
    // Default to "user"
  }

  const code = generateAuthCode({
    client_id,
    redirect_uri,
    code_challenge,
    userId,
    role,
  });

  return json({ redirect_uri, code, state });
}
