import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type AuthenticatedUser, authenticate } from "./auth/index.js";
import { getEnv } from "./env.js";
import { registerAdminTools } from "./tools/admin.js";
import { registerCakeTools } from "./tools/cakes.js";
import { registerCartTools } from "./tools/cart.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerRecipeTools } from "./tools/recipes.js";

const env = getEnv();

// ---------------------------------------------------------------------------
// Rate limiter (in-memory token bucket — per API key)
// ---------------------------------------------------------------------------
const rateLimitStore = new Map<
  string,
  { tokens: number; lastRefill: number }
>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(key) ?? {
    tokens: RATE_LIMIT,
    lastRefill: now,
  };

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor(elapsed / RATE_WINDOW_MS) * RATE_LIMIT;
  if (refill > 0) {
    bucket.tokens = Math.min(RATE_LIMIT, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return false;
  }

  bucket.tokens--;
  rateLimitStore.set(key, bucket);
  return true;
}

// ---------------------------------------------------------------------------
// Structured logger
// ---------------------------------------------------------------------------
function log(
  level: "info" | "warn" | "error",
  msg: string,
  extra?: Record<string, unknown>,
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: "dolce-atelier-mcp",
  version: "1.0.0",
});

// --- Stage 0: Ping ---
server.registerTool(
  "ping",
  {
    description: "Health check tool — returns pong",
  },
  async () => ({
    content: [{ type: "text" as const, text: "pong" }],
  }),
);

// --- Stage 2: Read-only tools ---
registerCakeTools(server);

// --- Stage 3: Write tools ---
registerCartTools(server);
registerOrderTools(server);
registerRecipeTools(server);

// --- Stage 4: Admin tools ---
registerAdminTools(server);

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const PORT = env.PORT;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const start = Date.now();

    // Health check (no auth, no rate limit)
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    // MCP endpoint
    if (url.pathname === "/mcp") {
      // Rate limit by API key
      const apiKey = req.headers.get("X-API-Key") || "anonymous";
      if (!checkRateLimit(apiKey)) {
        log("warn", "rate_limited", { apiKey: `${apiKey.slice(0, 8)}...` });
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authenticate
      const authResult = await authenticate(req.headers);
      if ("error" in authResult) {
        log("warn", "auth_failed", {
          method: req.method,
          hasApiKey: !!req.headers.get("X-API-Key"),
          hasAuth: !!req.headers.get("Authorization"),
          duration: Date.now() - start,
        });
        return authResult.error;
      }

      const authUser = authResult.authInfo as unknown as AuthenticatedUser;

      // Log successful auth
      log("info", "request", {
        method: req.method,
        userId: authUser.userId,
        role: authUser.role,
      });

      // Handle MCP request (cast back to AuthInfo for SDK)
      const response = await transport.handleRequest(req, {
        authInfo: authUser as unknown as AuthInfo,
      });
      return response;
    }

    return new Response("Not Found", { status: 404 });
  },
});

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});
await server.connect(transport);

log("info", "server_started", {
  port: PORT,
  backend: env.BACKEND_URL,
  hasClerkKey: true,
  hasApiKey: !!env.MCP_API_KEY,
  toolCount: 21,
});

console.log(`[MCP] Dolce Atelier MCP server on http://localhost:${PORT}`);
console.log(
  `[MCP] 21 tools registered (ping, search, cart, orders, recipes, admin)`,
);
