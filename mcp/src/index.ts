import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { type AuthenticatedUser, authenticate } from "./auth/index.js";
import {
  corsResponse,
  handleTokenGrant,
  tokenUiResponse,
} from "./auth/tokenEndpoint.js";
import { getEnv } from "./env.js";
import { log } from "./logger.js";
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
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(key) ?? {
    tokens: RATE_LIMIT,
    lastRefill: now,
  };

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

// Evict stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore) {
    if (now - bucket.lastRefill > RATE_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

// ---------------------------------------------------------------------------
// Session store (one McpServer + transport per session)
// ---------------------------------------------------------------------------
interface Session {
  transport: WebStandardStreamableHTTPServerTransport;
  server: McpServer;
}

const sessions = new Map<string, Session>();

// ---------------------------------------------------------------------------
// MCP Server factory — new instance per session
// ---------------------------------------------------------------------------
function createServer(): McpServer {
  const srv = new McpServer({
    name: "dolce-atelier-mcp",
    version: "1.0.0",
  });

  srv.registerTool(
    "ping",
    { description: "Health check tool — returns pong" },
    async () => ({ content: [{ type: "text" as const, text: "pong" }] }),
  );

  registerCakeTools(srv);
  registerCartTools(srv);
  registerOrderTools(srv);
  registerRecipeTools(srv);
  registerAdminTools(srv);

  return srv;
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const PORT = env.PORT;

function handleTokenRoute(req: Request): Response {
  if (req.method === "OPTIONS") {
    return corsResponse(null);
  }
  if (req.method === "GET") {
    return tokenUiResponse();
  }
  if (req.method === "POST") {
    return corsResponse(handleTokenGrant(req));
  }
  return corsResponse(
    new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function handleMcp(req: Request, start: number): Promise<Response> {
  const apiKey = req.headers.get("X-API-Key") || "anonymous";
  if (!checkRateLimit(apiKey)) {
    log("warn", "rate_limited", { apiKey: `${apiKey.slice(0, 8)}...` });
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

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
  log("info", "request", {
    method: req.method,
    userId: authUser.userId,
    role: authUser.role,
  });

  const sessionId = req.headers.get("mcp-session-id");

  // --- Existing session: route to its transport ---
  const session = sessionId ? sessions.get(sessionId) : undefined;
  if (session) {
    try {
      return await session.transport.handleRequest(req, {
        authInfo: authUser as unknown as AuthInfo,
      });
    } catch (err) {
      log("error", "transport_error", {
        sessionId,
        error: String(err),
        duration: Date.now() - start,
      });
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // --- Session ID provided but not found ---
  if (sessionId) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- No session ID: only POST with initialize is allowed ---
  if (req.method === "POST") {
    return handleInitialize(req, authUser, start);
  }

  return new Response(
    JSON.stringify({ error: "Bad Request: missing or invalid session" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

async function handleInitialize(
  req: Request,
  authUser: AuthenticatedUser,
  start: number,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const msg = body as JSONRPCMessage;
  if (
    !msg ||
    typeof msg !== "object" ||
    !("method" in msg) ||
    msg.method !== "initialize"
  ) {
    return new Response(
      JSON.stringify({ error: "Bad Request: missing or invalid session" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const newServer = createServer();

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sid) => {
      sessions.set(sid, { transport, server: newServer });
      log("info", "session_created", { sessionId: sid });
    },
    onsessionclosed: (sid) => {
      sessions.delete(sid);
      log("info", "session_closed", { sessionId: sid });
    },
  });

  await newServer.connect(transport);

  try {
    return await transport.handleRequest(req, {
      parsedBody: body,
      authInfo: authUser as unknown as AuthInfo,
    });
  } catch (err) {
    log("error", "transport_error", {
      phase: "initialize",
      error: String(err),
      duration: Date.now() - start,
    });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const start = Date.now();

    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    if (url.pathname === "/token") {
      return handleTokenRoute(req);
    }

    if (url.pathname === "/mcp") {
      return handleMcp(req, start);
    }

    return new Response("Not Found", { status: 404 });
  },
});

log("info", "server_started", {
  port: PORT,
  backend: env.BACKEND_URL,
  hasClerkKey: true,
  hasApiKey: !!env.MCP_API_KEY,
});

console.log(`[MCP] Dolce Atelier MCP server on http://localhost:${PORT}`);
