import { describe, it, expect, mock } from "bun:test";
import crypto from "node:crypto";

// Env must be set BEFORE importing modules that capture it at load time.
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-backend-mcp-secret-1234567890";

// --- Mock Clerk + Mongo BEFORE importing the service/route ---
const store = new Map<string, { mcpKeys?: any[] }>();
const fakeClerk = {
  users: {
    getUser: mock(async (id: string) => ({
      privateMetadata: store.get(id) ?? { mcpKeys: [] },
    })),
    updateUserMetadata: mock(
      async (id: string, patch: { privateMetadata?: any }) => {
        store.set(id, {
          ...(store.get(id) ?? {}),
          ...(patch.privateMetadata ?? {}),
        });
        return {};
      },
    ),
  },
};
mock.module("../lib/clerk", () => ({ clerkClient: fakeClerk }));

// Make verifyToken fall back to the local MCP token path deterministically
// (avoid a slow network call to Clerk for the non-Clerk bearer in route tests).
mock.module("@clerk/backend", () => ({
  verifyToken: mock(async () => {
    throw new Error("no clerk");
  }),
  createClerkClient: mock(() => ({ users: { getUser: mock(async () => ({})) } })),
}));

const sessionStore: any[] = [];
function matches(doc: any, q: any): boolean {
  for (const k of Object.keys(q)) {
    if (q[k] !== doc[k]) return false;
  }
  return true;
}
const fakeCollection = {
  insertOne: mock(async (doc: any) => {
    sessionStore.push(doc);
    return { insertedId: "x" };
  }),
  findOne: mock(async (q: any) => {
    return sessionStore.find((d) => matches(d, q)) ?? null;
  }),
  find: mock((q: any) => {
    const filtered = sessionStore.filter((d) => matches(d, q));
    return {
      sort: () => ({
        toArray: async () => filtered,
      }),
    };
  }),
  updateOne: mock(async (q: any, update: any) => {
    const i = sessionStore.findIndex((d) => matches(d, q));
    if (i < 0) return { matchedCount: 0, modifiedCount: 0 };
    sessionStore[i] = { ...sessionStore[i], ...update.$set };
    return { matchedCount: 1, modifiedCount: 1 };
  }),
};
// Capture the REAL connectDB BEFORE mocking lib/db so that db.test.ts (which
// imports connectDB from ../lib/db) still exercises the real implementation.
const realConnectDB = (await import("../lib/db")).connectDB;
mock.module("../lib/db", () => ({
  mongoose: { connection: { collection: () => fakeCollection } },
  connectDB: realConnectDB,
}));

const {
  createUserMcpSession,
  listUserMcpSessions,
  revokeUserMcpSession,
  findUserIdBySession,
} = await import("../services/mcpSession");
const { mcpRoutes } = await import("../routes/mcp");

// --- Helpers for route-level tests (signed MCP token) ---
const SECRET = process.env.MCP_JWT_SECRET;

function signMcpToken(sub: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub,
    role: "user",
    iat: now,
    exp: now + 3600,
    iss: "dolce-atelier-mcp",
    aud: "dolce-atelier-mcp",
  };
  const signingInput = `${b64(header)}.${b64(claims)}`;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${sig}`;
}

const BASE = "http://localhost";

function hashToken(t: string): string {
  return crypto.createHash("sha256").update(t).digest("hex");
}

describe("mcpSession service", () => {
  it("creates a session returning a raw token and an 8h expiry record", async () => {
    const { token, record } = await createUserMcpSession("user_1", "opencode");
    expect(token.startsWith("mcp_sess_")).toBe(true);
    expect(record.last4).toBe(token.slice(-4));
    expect(record.revoked).toBe(false);

    const expiresMs = new Date(record.expiresAt).getTime();
    const createdMs = new Date(record.createdAt).getTime();
    expect(expiresMs - createdMs).toBe(8 * 60 * 60 * 1000);
  });

  it("findUserIdBySession returns the userId for a valid, non-revoked token", async () => {
    const { token } = await createUserMcpSession("user_lookup");
    expect(await findUserIdBySession(token)).toBe("user_lookup");
  });

  it("findUserIdBySession returns null for an unknown token", async () => {
    expect(await findUserIdBySession("mcp_sess_unknown")).toBeNull();
  });

  it("findUserIdBySession returns null for a revoked token", async () => {
    const { token, record } = await createUserMcpSession("user_revoke");
    expect(await revokeUserMcpSession("user_revoke", record.id)).toBe(true);
    expect(await findUserIdBySession(token)).toBeNull();
  });

  it("findUserIdBySession returns null for an expired token", async () => {
    const token = "mcp_sess_expired";
    sessionStore.push({
      id: "exp_1",
      tokenHash: hashToken(token),
      userId: "user_expired",
      label: "default",
      createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      revoked: false,
      last4: token.slice(-4),
    });
    expect(await findUserIdBySession(token)).toBeNull();
  });

  it("revokeUserMcpSession returns false for an unknown id and true for owned", async () => {
    const { record } = await createUserMcpSession("user_owner");
    expect(await revokeUserMcpSession("user_owner", "nope")).toBe(false);
    expect(await revokeUserMcpSession("user_owner", record.id)).toBe(true);
  });

  it("listUserMcpSessions masks the token (last4) and reflects revoked", async () => {
    const a = await createUserMcpSession("user_list", "a");
    const b = await createUserMcpSession("user_list", "b");
    await revokeUserMcpSession("user_list", a.record.id);

    const list = await listUserMcpSessions("user_list");
    expect(list).toHaveLength(2);
    for (const s of list) {
      expect((s as any).token).toBeUndefined();
    }
    const aRecord = list.find((s) => s.id === a.record.id);
    const bRecord = list.find((s) => s.id === b.record.id);
    expect(aRecord?.revoked).toBe(true);
    expect(bRecord?.revoked).toBe(false);
  });
});

describe("mcpRoutes sessions (HTTP)", () => {
  it("rejects unauthenticated access to GET /sessions", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions`, { method: "GET" }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a session for an authenticated user", async () => {
    const token = signMcpToken("user_http_sess");
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "opencode" }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toContain("mcp_sess_");
    expect(data.label).toBe("opencode");
    expect(data.last4).toBe(data.token.slice(-4));
  });

  it("lists sessions for an authenticated user", async () => {
    const token = signMcpToken("user_http_list");
    await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "x" }),
      }),
    );
    const listRes = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(listRes.status).toBe(200);
    const data = await listRes.json();
    expect(data.sessions.length).toBeGreaterThan(0);
    expect((data.sessions[0] as any).token).toBeUndefined();
  });

  it("revokes a session for an authenticated user", async () => {
    const token = signMcpToken("user_http_revoke");
    const createRes = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "x" }),
      }),
    );
    const { id } = await createRes.json();
    const delRes = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(delRes.status).toBe(200);
    expect((await delRes.json()).success).toBe(true);
  });

  it("returns 404 revoking an unknown session", async () => {
    const token = signMcpToken("user_http_revoke_missing");
    const delRes = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/sessions/nope`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(delRes.status).toBe(404);
  });

  it("validates a session token via /session/validate", async () => {
    const { token } = await createUserMcpSession("user_val_sess");
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/session/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBe("user_val_sess");
  });

  it("rejects an invalid session token via /session/validate", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/session/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "mcp_sess_unknown" }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
