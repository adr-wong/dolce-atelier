import { afterEach, describe, expect, it, mock } from "bun:test";

// Env must be set BEFORE importing the module under test.
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET = process.env.MCP_JWT_SECRET || "test-secret-session";
process.env.MCP_API_KEY = process.env.MCP_API_KEY || "global-key-123";

const { resolveSessionToken } = await import("../auth/userKeys.js");
const { authenticate } = await import("../auth/index.js");

const API_KEY = process.env.MCP_API_KEY ?? "";

describe("resolveSessionToken", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns the userId on a 200 response", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ userId: "user_sess_1" }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;

    expect(await resolveSessionToken("mcp_sess_valid")).toBe("user_sess_1");
  });

  it("returns null on a 401 response", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ error: "invalid" }), { status: 401 }),
    ) as unknown as typeof fetch;

    expect(await resolveSessionToken("mcp_sess_bad")).toBeNull();
  });

  it("returns null when the backend is unreachable", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    expect(await resolveSessionToken("mcp_sess_down")).toBeNull();
  });

  it("caches the result for repeated lookups", async () => {
    const fetchMock = mock(
      async () =>
        new Response(JSON.stringify({ userId: "user_sess_cache" }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    expect(await resolveSessionToken("mcp_sess_cache")).toBe("user_sess_cache");
    expect(await resolveSessionToken("mcp_sess_cache")).toBe("user_sess_cache");
    // second call served from cache, no extra fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("authenticate (session token branch)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sets authInfo.userId when a valid session token is presented", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ userId: "user_x" }), { status: 200 }),
    ) as unknown as typeof fetch;

    const headers = new Headers({
      "X-API-Key": API_KEY,
      Authorization: "Bearer mcp_sess_xxx",
    });
    const result = await authenticate(headers);
    expect("authInfo" in result).toBe(true);
    if ("authInfo" in result) {
      expect((result.authInfo as any).userId).toBe("user_x");
    }
  });

  it("returns null for an invalid session token", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({}), { status: 401 }),
    ) as unknown as typeof fetch;

    expect(await resolveSessionToken("mcp_sess_invalid")).toBeNull();
  });
});
