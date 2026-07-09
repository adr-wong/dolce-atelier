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
const fetchMock = mock(async (_url: string, _opts?: unknown) => fetchResponse);
const originalFetch = globalThis.fetch;
// @ts-expect-error override for test
globalThis.fetch = fetchMock;
afterAll(() => {
  // @ts-expect-error restore
  globalThis.fetch = originalFetch;
});

const { registerOrderTools } = await import("../tools/orders.js");

function makeServer() {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, fn: unknown) => {
      handlers[name] = fn as (...a: unknown[]) => unknown;
    },
  } as never;
  registerOrderTools(server);
  return handlers;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const authInfo = { userId: "order-user", role: "user", token: "user-token" };

const baseCreateArgs = {
  email: "a@b.com",
  items: [{ pastelId: "p1", cantidad: 2 }],
  metodoEntrega: "TIENDA" as const,
  idempotencyKey: "idem-1",
};

describe("create_order handler", () => {
  it("returns idempotent cached response on repeat key", async () => {
    fetchResponse = jsonResponse({ _id: "order-1", total: 20 }, 201);
    const handlers = makeServer();
    await handlers["create_order"](baseCreateArgs, { authInfo });
    const res = (await handlers["create_order"](baseCreateArgs, {
      authInfo,
    })) as { content: { text: string }[] };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.idempotent).toBe(true);
    expect(parsed.order._id).toBe("order-1");
  });

  it("returns error content on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "bad order" }, 400);
    const handlers = makeServer();
    const res = (await handlers["create_order"](
      { ...baseCreateArgs, idempotencyKey: "idem-err" },
      { authInfo },
    )) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("bad order");
  });
});

describe("list_orders handler", () => {
  it("returns data on success", async () => {
    fetchResponse = jsonResponse([{ _id: "o1" }]);
    const handlers = makeServer();
    const res = (await handlers["list_orders"]({ estado: "PENDIENTE" }, {
      authInfo,
    })) as { content: { text: string }[] };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed[0]._id).toBe("o1");
  });

  it("returns error content on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "fail" }, 500);
    const handlers = makeServer();
    const res = (await handlers["list_orders"]({}, {
      authInfo,
    })) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
  });
});

describe("get_order handler", () => {
  it("returns data on success", async () => {
    fetchResponse = jsonResponse({ _id: "o9" });
    const handlers = makeServer();
    const res = (await handlers["get_order"]({ id: "o9" }, {
      authInfo,
    })) as { content: { text: string }[] };
    expect(JSON.parse(res.content[0].text)._id).toBe("o9");
  });

  it("returns error content on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "Not found" }, 404);
    const handlers = makeServer();
    const res = (await handlers["get_order"]({ id: "missing" }, {
      authInfo,
    })) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
  });
});
