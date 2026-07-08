import { describe, expect, it } from "bun:test";

process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-clients-tests";
process.env.MCP_CLIENTS = JSON.stringify([
  {
    client_id: "mcp_demo",
    client_secret: "demo-secret",
    userId: "user_demo",
    role: "user",
  },
]);

const { authenticateClient, registerClient } = await import(
  "../auth/clients.js"
);

describe("clients", () => {
  it("authenticates a seeded client", () => {
    const client = authenticateClient("mcp_demo", "demo-secret");
    expect(client).not.toBeNull();
    expect(client?.userId).toBe("user_demo");
  });

  it("rejects a bad secret", () => {
    expect(authenticateClient("mcp_demo", "wrong")).toBeNull();
  });

  it("rejects an unknown client", () => {
    expect(authenticateClient("nope", "nope")).toBeNull();
  });

  it("registers an in-memory client and authenticates it", () => {
    const created = registerClient("user_new", "user");
    expect(created.client_id.startsWith("mcp_")).toBe(true);
    const auth = authenticateClient(created.client_id, created.client_secret);
    expect(auth?.userId).toBe("user_new");
  });
});
