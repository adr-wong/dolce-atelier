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

const indexStore: any[] = [];
const fakeCollection = {
  insertOne: mock(async (doc: any) => {
    indexStore.push(doc);
    return { insertedId: "x" };
  }),
  deleteOne: mock(async (q: any) => {
    const i = indexStore.findIndex((d) => d.keyHash === q.keyHash);
    if (i >= 0) indexStore.splice(i, 1);
    return { deletedCount: 1 };
  }),
  findOne: mock(async (q: any) => {
    return indexStore.find((d) => d.keyHash === q.keyHash) ?? null;
  }),
};
// Capture the REAL connectDB BEFORE mocking lib/db so that db.test.ts (which
// imports connectDB from ../lib/db) still exercises the real implementation.
const realConnectDB = (await import("../lib/db")).connectDB;
mock.module("../lib/db", () => ({
  mongoose: { connection: { collection: () => fakeCollection } },
  connectDB: realConnectDB,
}));

const { getUserMcpKeys, createUserMcpKey, deleteUserMcpKey, findUserIdByKey } =
  await import("../services/mcpKey");
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

describe("mcpKey service", () => {
  it("creates, lists and deletes a per-user key", async () => {
    const created = await createUserMcpKey("user_1", "agent");
    expect(created.key.startsWith("mcp_")).toBe(true);
    expect(created.label).toBe("agent");

    const list = await getUserMcpKeys("user_1");
    expect(list).toHaveLength(1);
    expect(list[0].last4).toBe(created.key.slice(-4));
    expect((list[0] as any).key).toBeUndefined();

    const found = await findUserIdByKey(created.key);
    expect(found).toBe("user_1");

    const ok = await deleteUserMcpKey("user_1", created.id);
    expect(ok).toBe(true);
    expect(await getUserMcpKeys("user_1")).toHaveLength(0);
    expect(await findUserIdByKey(created.key)).toBeNull();
  });

  it("returns false deleting a missing key", async () => {
    expect(await deleteUserMcpKey("user_1", "nope")).toBe(false);
  });

  it("isolates keys per user", async () => {
    const a = await createUserMcpKey("user_a", "x");
    expect(await getUserMcpKeys("user_b")).toHaveLength(0);
    expect(await findUserIdByKey(a.key)).toBe("user_a");
  });
});

describe("mcpRoutes (HTTP)", () => {
  it("rejects unauthenticated access", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/keys`, { method: "GET" }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a key for an authenticated user", async () => {
    const token = signMcpToken("user_http");
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/keys`, {
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
    expect(data.key).toContain("mcp_");
    expect(data.label).toBe("opencode");
  });

  it("validates a key via /validate", async () => {
    const created = await createUserMcpKey("user_val", "v");
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: created.key }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBe("user_val");
  });

  it("rejects an unknown key via /validate", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "mcp_unknown" }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
