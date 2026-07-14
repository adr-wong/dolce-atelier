import { Elysia, t } from "elysia";
import { verifyToken } from "../middleware/auth";
import {
  getUserMcpKeys,
  createUserMcpKey,
  deleteUserMcpKey,
  findUserIdByKey,
} from "../services/mcpKey";
import {
  createUserMcpSession,
  listUserMcpSessions,
  revokeUserMcpSession,
  findUserIdBySession,
} from "../services/mcpSession";
import {
  upsertOAuthClient,
  getOAuthClient,
  createOAuthRefresh,
  getOAuthRefresh,
  revokeOAuthRefresh,
} from "../services/mcpOAuth";

async function requireUserId(request: Request): Promise<string | null> {
  return verifyToken(request.headers.get("Authorization"));
}

// HU-017: MCP API Keys management (per-user, stored in Clerk privateMetadata).
// The global MCP_API_KEY remains a server-level fallback handled by the MCP
// server; here each user owns their own keys. A Mongo index (mcpKeyIndex)
// maps key hash -> userId for O(1) validation by the MCP server.
export const mcpRoutes = new Elysia({ prefix: "/api/mcp" })
  .get("/keys", async ({ request, set }) => {
    const userId = await requireUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "No autenticado" };
    }
    return { keys: await getUserMcpKeys(userId) };
  })
  .post(
    "/keys",
    async ({ request, body, set }) => {
      const userId = await requireUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "No autenticado" };
      }
      const { label } = body as { label?: string };
      const key = await createUserMcpKey(userId, label ?? "default");
      return {
        id: key.id,
        key: key.key,
        label: key.label,
        createdAt: key.createdAt,
        last4: key.key.slice(-4),
      };
    },
    {
      body: t.Object({ label: t.Optional(t.String()) }),
    },
  )
  .delete(
    "/keys/:id",
    async ({ request, params, set }) => {
      const userId = await requireUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "No autenticado" };
      }
      const ok = await deleteUserMcpKey(userId, params.id);
      if (!ok) {
        set.status = 404;
        return { error: "Key no encontrada" };
      }
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // Internal validation used by the MCP server to resolve a per-user key.
  .post(
    "/validate",
    async ({ body, set }) => {
      const { apiKey } = body as { apiKey: string };
      if (!apiKey) {
        set.status = 400;
        return { error: "apiKey requerido" };
      }
      const userId = await findUserIdByKey(apiKey);
      if (!userId) {
        set.status = 401;
        return { error: "invalid" };
      }
      return { userId };
    },
    {
      body: t.Object({ apiKey: t.String() }),
    },
  )
  .get("/sessions", async ({ request, set }) => {
    const userId = await requireUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "No autenticado" };
    }
    return { sessions: await listUserMcpSessions(userId) };
  })
  .post(
    "/sessions",
    async ({ request, body, set }) => {
      const userId = await requireUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "No autenticado" };
      }
      const { label } = body as { label?: string };
      const { token, record } = await createUserMcpSession(userId, label);
      return {
        id: record.id,
        token,
        label: record.label,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        last4: record.last4,
      };
    },
    {
      body: t.Object({ label: t.Optional(t.String()) }),
    },
  )
  .delete(
    "/sessions/:id",
    async ({ request, params, set }) => {
      const userId = await requireUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "No autenticado" };
      }
      const ok = await revokeUserMcpSession(userId, params.id);
      if (!ok) {
        set.status = 404;
        return { error: "Sesión no encontrada" };
      }
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  .post(
    "/session/validate",
    async ({ body, set }) => {
      const { token } = body as { token: string };
      const userId = await findUserIdBySession(token);
      if (!userId) {
        set.status = 401;
        return { error: "invalid" };
      }
      return { userId };
    },
    {
      body: t.Object({ token: t.String() }),
    },
  )
  // Internal, UNAUTHENTICATED: persist a dynamically-registered OAuth client
  // (public, PKCE) created by the MCP server per RFC 7591. Mirrors the no-auth
  // pattern of /validate above.
  .post(
    "/oauth/clients",
    async ({ body, set }) => {
      const c = body as {
        client_id: string;
        redirect_uris: string[];
        scope?: string;
        client_name?: string | null;
      };
      if (!c.client_id || !Array.isArray(c.redirect_uris)) {
        set.status = 400;
        return { error: "client_id and redirect_uris are required" };
      }
      const stored = await upsertOAuthClient({
        client_id: c.client_id,
        redirect_uris: c.redirect_uris,
        scope: c.scope ?? "openid profile email",
        client_name: c.client_name ?? null,
        createdAt: new Date().toISOString(),
      });
      set.status = 201;
      return stored;
    },
    {
      body: t.Object({
        client_id: t.String(),
        redirect_uris: t.Array(t.String()),
        scope: t.Optional(t.String()),
        client_name: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  )
  // Internal, UNAUTHENTICATED: look up a stored OAuth client by client_id.
  // Mirrors the no-auth pattern of /validate and /oauth/clients.
  .get("/oauth/client", async ({ request, set }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("client_id");
    if (!clientId) {
      set.status = 400;
      return { error: "client_id requerido" };
    }
    const client = await getOAuthClient(clientId);
    if (!client) {
      set.status = 404;
      return { error: "Cliente no encontrado" };
    }
    return client;
  })
  // Internal, UNAUTHENTICATED: persist a refresh token issued by the MCP
  // server. Mirrors the no-auth pattern of /validate above.
  .post(
    "/oauth/refresh",
    async ({ body, set }) => {
      const r = body as {
        token: string;
        clientId: string;
        userId: string;
        role?: string;
        expiresAt: string;
      };
      if (!r.token || !r.clientId || !r.userId || !r.expiresAt) {
        set.status = 400;
        return { error: "token, clientId, userId and expiresAt are required" };
      }
      const stored = await createOAuthRefresh({
        token: r.token,
        clientId: r.clientId,
        userId: r.userId,
        role: r.role ?? "user",
        expiresAt: r.expiresAt,
      });
      set.status = 201;
      return stored;
    },
    {
      body: t.Object({
        token: t.String(),
        clientId: t.String(),
        userId: t.String(),
        role: t.Optional(t.String()),
        expiresAt: t.String(),
      }),
    },
  )
  // Internal, UNAUTHENTICATED: look up a stored refresh token. Returns the
  // record, or 404 when unknown (e.g. revoked/rotated).
  .get("/oauth/refresh", async ({ request, set }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      set.status = 400;
      return { error: "token requerido" };
    }
    const rec = await getOAuthRefresh(token);
    if (!rec) {
      set.status = 404;
      return { error: "Refresh token no encontrado" };
    }
    return rec;
  })
  // Internal, UNAUTHENTICATED: revoke a stored refresh token.
  .delete("/oauth/refresh", async ({ request, set }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      set.status = 400;
      return { error: "token requerido" };
    }
    await revokeOAuthRefresh(token);
    return { success: true };
  });
