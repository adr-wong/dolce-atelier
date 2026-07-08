import { createClerkClient } from "@clerk/backend";
import { getEnv } from "../env.js";
import { log } from "../logger.js";
import { authenticateClient } from "./clients.js";
import { verifyClerkJwt } from "./index.js";
import { type McpRole, signMcpToken } from "./issuer.js";

const env = getEnv();
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

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

// ---------------------------------------------------------------------------
// OAuth 2.0 Token endpoint (grant handler)
//   - grant_type=client_credentials        → machine agents (seeded clients)
//   - grant_type=clerk_exchange             → human-in-the-loop (reuses Clerk)
//     body: { clerk_token: "<clerk session jwt>" }
// Returns: { access_token, token_type: "Bearer", expires_in }
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
    return new Response(
      JSON.stringify({
        error: "invalid_request",
        error_description: "Bad body",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const grantType = params.grant_type;

  // --- Machine flow: client_credentials ---
  if (grantType === "client_credentials") {
    const client = authenticateClient(
      params.client_id ?? "",
      params.client_secret ?? "",
    );
    if (!client) {
      log("warn", "token_grant_failed", { grant: "client_credentials" });
      return new Response(
        JSON.stringify({
          error: "invalid_client",
          error_description: "Unknown client or bad secret",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const accessToken = signMcpToken({
      userId: client.userId,
      role: client.role,
    });
    log("info", "token_issued", {
      grant: "client_credentials",
      userId: client.userId,
      role: client.role,
    });
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: env.MCP_TOKEN_TTL,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // --- Human flow: exchange a Clerk session token for an MCP agent token ---
  if (
    grantType === "clerk_exchange" ||
    grantType === "urn:ietf:params:oauth:grant-type:token-exchange"
  ) {
    const clerkToken = params.clerk_token ?? params.subject_token;
    if (!clerkToken) {
      return new Response(
        JSON.stringify({
          error: "invalid_request",
          error_description: "clerk_token is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const userId = await verifyClerkJwt(`Bearer ${clerkToken}`);
    if (!userId) {
      log("warn", "token_grant_failed", { grant: "clerk_exchange" });
      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Clerk token verification failed",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    let role: McpRole = "user";
    try {
      const user = await clerkClient.users.getUser(userId);
      const metadata = user.publicMetadata as { role?: string };
      if (metadata.role === "admin" || metadata.role === "superadmin") {
        role = metadata.role as McpRole;
      }
    } catch {
      // Default to "user"
    }
    const accessToken = signMcpToken({ userId, role });
    log("info", "token_issued", { grant: "clerk_exchange", userId, role });
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: env.MCP_TOKEN_TTL,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      error: "unsupported_grant_type",
      error_description: "Supported: client_credentials, clerk_exchange",
    }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

// ---------------------------------------------------------------------------
// Minimal user-friendly token UI (GET /token)
// ---------------------------------------------------------------------------
export function tokenUiResponse(): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Dolce Atelier — MCP Agent Token</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.4rem; }
  .card { border: 1px solid #ccc; border-radius: 12px; padding: 1rem 1.25rem; margin: 1rem 0; }
  label { display: block; font-weight: 600; margin-top: .75rem; }
  input, textarea, select { width: 100%; padding: .5rem; margin-top: .25rem; box-sizing: border-box; }
  button { margin-top: 1rem; padding: .55rem 1rem; border: 0; border-radius: 8px; background: #c2410c; color: #fff; cursor: pointer; }
  pre { background: #1118; color: #eee; padding: .75rem; border-radius: 8px; overflow:auto; white-space: pre-wrap; }
  code { font-family: ui-monospace, monospace; }
  .hint { color: #888; font-size: .85rem; }
</style>
</head>
<body>
<h1>Dolce Atelier — MCP Agent Token</h1>
<p class="hint">Get a short-lived JWT your agent (opencode, etc.) can use as <code>Authorization: Bearer &lt;token&gt;</code> against the MCP server.</p>

<div class="card">
  <h3>Machine agent (OAuth client_credentials)</h3>
  <label>client_id</label><input id="cid" placeholder="mcp_demo" />
  <label>client_secret</label><input id="csec" type="password" placeholder="..." />
  <button onclick="clientCreds()">Issue token</button>
</div>

<div class="card">
  <h3>Human (reuse Clerk login)</h3>
  <p class="hint">Paste a Clerk session token (e.g. from your app via <code>clerk.session.getToken()</code>).</p>
  <label>clerk_token</label><textarea id="ctok" rows="3" placeholder="eyJ..."></textarea>
  <button onclick="clerkExchange()">Exchange for agent token</button>
</div>

<div class="card">
  <h3>Access token</h3>
  <pre id="out">—</pre>
  <button onclick="copyToken()">Copy token</button>
</div>

<div class="card">
  <h3>opencode.json snippet</h3>
  <pre id="oc">{
  "mcp": {
    "dolce-atelier": {
      "type": "remote",
      "url": "${env.PORT ? `http://localhost:${env.PORT}` : "MCP_URL"}/mcp",
      "headers": {
        "X-API-Key": "YOUR_MCP_API_KEY",
        "Authorization": "Bearer " + token
      }
    }
  }
}</pre>
  <p class="hint">Put the token in an env var (e.g. <code>MCP_ACCESS_TOKEN</code>) and reference it with <code>{env:MCP_ACCESS_TOKEN}</code>.</p>
</div>

<script>
const TOKEN_URL = window.location.origin + "/token";
async function post(body) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}
async function clientCreds() {
  const data = await post({ grant_type: "client_credentials", client_id: cid.value, client_secret: csec.value });
  out.textContent = data.access_token ? data.access_token : JSON.stringify(data, null, 2);
}
async function clerkExchange() {
  const data = await post({ grant_type: "clerk_exchange", clerk_token: ctok.value });
  out.textContent = data.access_token ? data.access_token : JSON.stringify(data, null, 2);
}
function copyToken() { navigator.clipboard.writeText(out.textContent); }
</script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
