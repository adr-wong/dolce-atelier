import { afterAll, describe, expect, it, mock } from "bun:test";

// Configure env BEFORE importing any module that reads getEnv().
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.MCP_JWT_SECRET = "test-secret";
process.env.MCP_API_KEY = "test-key";

// No network needed; cart uses in-memory store + real requireAuth.
const originalFetch = globalThis.fetch;
afterAll(() => {
  // @ts-expect-error restore
  globalThis.fetch = originalFetch;
});

const { registerCartTools } = await import("../tools/cart.js");

function makeServer() {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, fn: unknown) => {
      handlers[name] = fn as (...a: unknown[]) => unknown;
    },
  } as never;
  registerCartTools(server);
  return handlers;
}

// Use a distinct userId per test: cartStore is module-level and keyed by userId.
const authInfo = (id: string) => ({ userId: id, role: "user", token: "tok" });

describe("get_cart handler", () => {
  it("returns empty cart for a new user", async () => {
    const handlers = makeServer();
    const res = (await handlers["get_cart"]({}, { authInfo: authInfo("cart-get") })) as {
      content: { text: string }[];
    };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.itemCount).toBe(0);
    expect(parsed.total).toBe(0);
  });
});

describe("add_to_cart handler", () => {
  it("adds a new item and computes total", async () => {
    const handlers = makeServer();
    const res = (await handlers["add_to_cart"](
      {
        pastelId: "p1",
        cantidad: 2,
        nombre: "Cake A",
        precio: 10,
        imagen: "http://img/a.jpg",
      },
      { authInfo: authInfo("cart-add") },
    )) as { content: { text: string }[] };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.cart.itemCount).toBe(1);
    expect(parsed.cart.total).toBe(20);
  });

  it("merges quantity when adding an existing item", async () => {
    const handlers = makeServer();
    await handlers["add_to_cart"](
      {
        pastelId: "p2",
        cantidad: 1,
        nombre: "Cake B",
        precio: 5,
        imagen: "http://img/b.jpg",
      },
      { authInfo: authInfo("cart-merge") },
    );
    const res = (await handlers["add_to_cart"](
      {
        pastelId: "p2",
        cantidad: 3,
        nombre: "Cake B",
        precio: 5,
        imagen: "http://img/b.jpg",
      },
      { authInfo: authInfo("cart-merge") },
    )) as { content: { text: string }[] };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.cart.itemCount).toBe(1);
    expect(parsed.cart.items[0].cantidad).toBe(4);
    expect(parsed.cart.total).toBe(20);
  });
});
