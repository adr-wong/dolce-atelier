import crypto from "node:crypto";
import { getEnv } from "../../env.js";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

interface RegisterRecord {
  client_id: string;
  client_secret: string | null;
  redirect_uris: string[];
  response_types: string[];
  grant_types: string[];
  token_endpoint_auth_method: string;
  scope: string;
  client_name: string | null;
}

// RFC 7591: OAuth 2.0 Dynamic Client Registration.
// The MCP server issues PUBLIC clients (no secret) that authenticate via PKCE.
// The client record is persisted in the backend so it survives restarts.
export async function handleRegister(req: Request): Promise<Response> {
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
      { error: "invalid_client_metadata", error_description: "Bad JSON body" },
      400,
    );
  }

  const redirectUrisRaw = body.redirect_uris;
  const redirect_uris = Array.isArray(redirectUrisRaw)
    ? redirectUrisRaw.filter((u): u is string => typeof u === "string")
    : [];
  if (redirect_uris.length === 0) {
    return json(
      {
        error: "invalid_redirect_uri",
        error_description: "redirect_uris must contain at least one URI",
      },
      400,
    );
  }

  const scope =
    typeof body.scope === "string" ? body.scope : "openid profile email";
  const client_name =
    typeof body.client_name === "string" ? body.client_name : null;

  const client_id = `mcp_oauth_${crypto.randomBytes(12).toString("hex")}`;
  const record: RegisterRecord = {
    client_id,
    client_secret: null,
    redirect_uris,
    response_types: ["code"],
    grant_types: ["authorization_code", "refresh_token"],
    token_endpoint_auth_method: "none",
    scope,
    client_name,
  };

  // Persist in the backend (no-auth internal route).
  try {
    let base = getEnv().BACKEND_URL;
    while (base.endsWith("/")) base = base.slice(0, -1);
    const res = await fetch(`${base}/api/mcp/oauth/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      return json(
        {
          error: "invalid_client_metadata",
          error_description: "Backend rejected client registration",
        },
        400,
      );
    }
  } catch {
    return json(
      {
        error: "invalid_client_metadata",
        error_description: "Failed to reach backend for persistence",
      },
      400,
    );
  }

  // RFC 7591 response. Omit client_secret when null (public client).
  const response: Record<string, unknown> = {
    client_id: record.client_id,
    redirect_uris: record.redirect_uris,
    response_types: record.response_types,
    grant_types: record.grant_types,
    token_endpoint_auth_method: record.token_endpoint_auth_method,
    scope: record.scope,
  };
  if (record.client_name !== null) response.client_name = record.client_name;
  if (record.client_secret !== null) {
    response.client_secret = record.client_secret;
  }

  return json(response, 201);
}
