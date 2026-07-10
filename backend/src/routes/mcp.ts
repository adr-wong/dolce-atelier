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
  );
