import { afterAll, describe, expect, it, mock } from "bun:test";

// Configure env BEFORE importing any module that reads getEnv().
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.MCP_JWT_SECRET = "test-secret";
process.env.MCP_API_KEY = "test-key";

// Prevent real network by stubbing global fetch (callBackend uses it).
let fetchResponse: Response = new Response("{}", {
  status: 200,
  headers: { "content-type": "application/json" },
});
let lastCallOptions: { headers?: Record<string, string> } | undefined;
const fetchMock = mock(
  async (_url: string, opts?: { headers?: Record<string, string> }) => {
    lastCallOptions = opts;
    return fetchResponse;
  },
);
const originalFetch = globalThis.fetch;
// @ts-expect-error override for test
globalThis.fetch = fetchMock;
afterAll(() => {
  // @ts-expect-error restore
  globalThis.fetch = originalFetch;
});

const { registerRecipeTools } = await import("../tools/recipes.js");

function makeServer() {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, fn: unknown) => {
      handlers[name] = fn as (...a: unknown[]) => unknown;
    },
  } as never;
  registerRecipeTools(server);
  return handlers;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const authInfo = { userId: "recipe-user", role: "user", token: "tok" };

describe("submit_recipe handler", () => {
  it("submits recipe on success", async () => {
    fetchResponse = jsonResponse({ _id: "r1", nota: "hello" }, 201);
    const handlers = makeServer();
    const res = (await handlers["submit_recipe"](
      { nota: "hello", personas: 4, archivoUrl: "https://x.com/i.jpg" },
      { authInfo },
    )) as { content: { text: string }[] };
    expect(JSON.parse(res.content[0].text)._id).toBe("r1");
  });

  it("returns error on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "bad recipe" }, 422);
    const handlers = makeServer();
    const res = (await handlers["submit_recipe"](
      { nota: "x", personas: 1 },
      { authInfo },
    )) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
  });
});

describe("list_my_recipes handler", () => {
  it("returns data with estado filter", async () => {
    fetchResponse = jsonResponse([{ _id: "r2" }]);
    const handlers = makeServer();
    const res = (await handlers["list_my_recipes"]({ estado: "PENDIENTE" }, {
      authInfo,
    })) as { content: { text: string }[] };
    expect(JSON.parse(res.content[0].text)[0]._id).toBe("r2");
  });

  it("returns error on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "fail" }, 500);
    const handlers = makeServer();
    const res = (await handlers["list_my_recipes"]({}, {
      authInfo,
    })) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
  });
});

describe("accept_quote handler", () => {
  it("includes x-user-email header when email provided", async () => {
    fetchResponse = jsonResponse({ url: "https://stripe/checkout" });
    const handlers = makeServer();
    const res = (await handlers["accept_quote"](
      { recetaId: "r3", email: "c@d.com" },
      { authInfo },
    )) as { content: { text: string }[] };
    expect(JSON.parse(res.content[0].text).url).toContain("stripe");
    expect(lastCallOptions?.headers?.["x-user-email"]).toBe("c@d.com");
  });

  it("omits email header and returns error on failure", async () => {
    fetchResponse = jsonResponse({ error: "pay fail" }, 402);
    const handlers = makeServer();
    const res = (await handlers["accept_quote"](
      { recetaId: "r4" },
      { authInfo },
    )) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
    expect(lastCallOptions?.headers?.["x-user-email"]).toBeUndefined();
  });
});
