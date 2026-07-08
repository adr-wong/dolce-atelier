import { afterEach, describe, expect, it, mock } from "bun:test";

// Env must be set BEFORE importing the module under test.
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-userkeys";
process.env.MCP_API_KEY = process.env.MCP_API_KEY || "global-key-123";

const { resolveUserKey } = await import("../auth/userKeys.js");

describe("resolveUserKey", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns the userId on a 200 response", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ userId: "user_42" }), { status: 200 }),
    ) as unknown as typeof fetch;

    expect(await resolveUserKey("mcp_valid")).toBe("user_42");
  });

  it("returns null on a 401 response", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ error: "invalid" }), { status: 401 }),
    ) as unknown as typeof fetch;

    expect(await resolveUserKey("mcp_bad")).toBeNull();
  });

  it("returns null when the backend is unreachable", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    expect(await resolveUserKey("mcp_down")).toBeNull();
  });

  it("caches the result for repeated lookups", async () => {
    const fetchMock = mock(
      async () =>
        new Response(JSON.stringify({ userId: "user_cached" }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    expect(await resolveUserKey("mcp_cache")).toBe("user_cached");
    expect(await resolveUserKey("mcp_cache")).toBe("user_cached");
    // second call served from cache, no extra fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
