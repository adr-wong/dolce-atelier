import { describe, it, expect, mock } from "bun:test";

process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-backend-mcp-secret-1234567890";

// --- Mock Clerk + Mongo BEFORE importing the service/route ---
const docStore: any[] = [];
function matches(doc: any, q: any): boolean {
  for (const k of Object.keys(q)) {
    if (q[k] !== doc[k]) return false;
  }
  return true;
}
const fakeCollection = {
  createIndex: mock(async () => ({})),
  insertOne: mock(async (doc: any) => {
    docStore.push(doc);
    return { insertedId: "x" };
  }),
  findOne: mock(async (q: any) => docStore.find((d) => matches(d, q)) ?? null),
  find: mock((q: any) => {
    const filtered = docStore.filter((d) => matches(d, q));
    return {
      sort: () => ({
        toArray: async () => filtered,
      }),
    };
  }),
  updateOne: mock(async (q: any, update: any) => {
    const i = docStore.findIndex((d) => matches(d, q));
    if (i < 0) {
      docStore.push({ ...update.$set });
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
    }
    docStore[i] = { ...docStore[i], ...update.$set };
    return { matchedCount: 1, modifiedCount: 1 };
  }),
  deleteOne: mock(async (q: any) => {
    const i = docStore.findIndex((d) => matches(d, q));
    if (i < 0) return { deletedCount: 0 };
    docStore.splice(i, 1);
    return { deletedCount: 1 };
  }),
};

const realConnectDB = (await import("../lib/db")).connectDB;
mock.module("../lib/db", () => ({
  mongoose: { connection: { collection: () => fakeCollection } },
  connectDB: realConnectDB,
}));
mock.module("../lib/clerk", () => ({
  clerkClient: { users: { getUser: mock(async () => ({})) } },
}));
mock.module("@clerk/backend", () => ({
  verifyToken: mock(async () => {
    throw new Error("no clerk");
  }),
  createClerkClient: mock(() => ({ users: { getUser: mock(async () => ({})) } })),
}));

const {
  upsertOAuthClient,
  getOAuthClient,
  findOAuthClient,
  createOAuthRefresh,
  getOAuthRefresh,
  revokeOAuthRefresh,
} = await import("../services/mcpOAuth");
const { mcpRoutes } = await import("../routes/mcp");

const BASE = "http://localhost";

describe("mcpOAuth service", () => {
  it("upserts a client and reads it back", async () => {
    const rec = await upsertOAuthClient({
      client_id: "client_a",
      redirect_uris: ["https://app/cb"],
      scope: "openid",
      client_name: "A",
      createdAt: new Date().toISOString(),
    });
    expect(rec.client_id).toBe("client_a");
    expect(rec.redirect_uris).toEqual(["https://app/cb"]);

    const found = await getOAuthClient("client_a");
    expect(found?.client_id).toBe("client_a");
    expect(await findOAuthClient("client_a")).not.toBeNull();
    expect(await findOAuthClient("nope")).toBeNull();
    expect(await getOAuthClient("nope")).toBeNull();
  });

  it("stores a refresh token, looks it up, and revokes it", async () => {
    const rec = await createOAuthRefresh({
      token: "refresh_1",
      clientId: "client_a",
      userId: "user_1",
      role: "user",
      expiresAt: new Date(Date.now() + 1000).toISOString(),
    });
    expect(rec.token).toBe("refresh_1");

    const found = await getOAuthRefresh("refresh_1");
    expect(found?.userId).toBe("user_1");
    expect(await getOAuthRefresh("missing")).toBeNull();

    await revokeOAuthRefresh("refresh_1");
    expect(await getOAuthRefresh("refresh_1")).toBeNull();
  });
});

describe("mcpOAuth routes (unauthenticated)", () => {
  it("POST /oauth/clients stores and returns 201", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "client_b",
          redirect_uris: ["https://app/cb"],
          scope: "openid",
          client_name: "B",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.client_id).toBe("client_b");
  });

  it("POST /oauth/clients rejects missing client_id", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirect_uris: ["https://app/cb"] }),
      }),
    );
    // Elysia rejects the body schema (client_id required) with 422.
    expect(res.status).toBe(422);
  });

  it("GET /oauth/client returns the client", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/client?client_id=client_b`),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).client_id).toBe("client_b");
  });

  it("GET /oauth/client 400 when client_id missing", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/client`),
    );
    expect(res.status).toBe(400);
  });

  it("GET /oauth/client 404 for unknown client", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/client?client_id=nope`),
    );
    expect(res.status).toBe(404);
  });

  it("POST /oauth/refresh stores and returns 201", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "refresh_2",
          clientId: "client_b",
          userId: "user_2",
          role: "user",
          expiresAt: new Date(Date.now() + 1000).toISOString(),
        }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it("POST /oauth/refresh 422 when required fields missing (schema)", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "x" }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("GET /oauth/refresh returns the record", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh?token=refresh_2`),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe("refresh_2");
  });

  it("GET /oauth/refresh 400 when token missing", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh`),
    );
    expect(res.status).toBe(400);
  });

  it("GET /oauth/refresh 404 for unknown token", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh?token=ghost`),
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /oauth/refresh revokes the token", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh?token=refresh_2`, {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("DELETE /oauth/refresh 400 when token missing", async () => {
    const res = await mcpRoutes.handle(
      new Request(`${BASE}/api/mcp/oauth/refresh`, { method: "DELETE" }),
    );
    expect(res.status).toBe(400);
  });
});
