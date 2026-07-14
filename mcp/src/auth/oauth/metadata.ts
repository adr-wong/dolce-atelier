import { getEnv } from "../../env.js";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

function baseUrl(): string {
  let base = getEnv().MCP_PUBLIC_URL;
  while (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

// RFC 8414: OAuth 2.0 Authorization Server Metadata + Protected Resource Metadata.
// Served at the standard `.well-known` paths so clients can auto-discover config.
export function metadataRoutes(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "GET") return null;

  const url = new URL(req.url);
  const base = baseUrl();

  if (url.pathname === "/.well-known/oauth-protected-resource") {
    return json({
      resource: base,
      authorization_servers: [base],
      scopes_supported: ["openid", "profile", "email"],
      bearer_methods_supported: ["header"],
      resource_signing_alg_values_supported: ["RS256"],
    });
  }

  if (url.pathname === "/.well-known/oauth-authorization-server") {
    return json({
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/token`,
      registration_endpoint: `${base}/register`,
      scopes_supported: ["openid", "profile", "email"],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  }

  return null;
}
