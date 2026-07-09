import { afterAll, describe, expect, it, mock } from "bun:test";

// Configure env BEFORE importing any module that reads getEnv().
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.MCP_JWT_SECRET = "test-secret";
process.env.MCP_API_KEY = "test-key";

// Prevent real network: stub global fetch (callBackend uses it). The real
// requireAuth/requireRole just read authInfo, so handlers run unmodified.
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

const { registerCakeTools } = await import("../tools/cakes.js");

function makeServer() {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, fn: unknown) => {
      handlers[name] = fn as (...a: unknown[]) => unknown;
    },
  } as never;
  registerCakeTools(server);
  return handlers;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("search_cakes handler", () => {
  it("builds query string and maps success response", async () => {
    fetchResponse = jsonResponse({
      pasteles: [
        {
          _id: "c1",
          nombre: "Tres Leches",
          precio: 25,
          categoria: "vainilla",
          imagen: "http://img/x.jpg",
          disponible: true,
          descripcion: "yum",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-02",
        },
      ],
      total: 1,
      page: 2,
      totalPages: 5,
    });
    const handlers = makeServer();
    const res = (await handlers["search_cakes"]({
      q: "leches",
      categoria: "vainilla",
      precioMin: 10,
      precioMax: 50,
      ordenarPor: "precio",
      orden: "asc",
      page: 2,
      limit: 1,
    })) as { content: { text: string }[] };
    expect(res.content[0].text).toContain("Tres Leches");
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.total).toBe(1);
    expect(parsed.cakes[0].id).toBe("c1");
  });

  it("returns error content on backend failure", async () => {
    fetchResponse = jsonResponse({ error: "boom" }, 500);
    const handlers = makeServer();
    const res = (await handlers["search_cakes"]({})) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("boom");
  });
});

describe("get_cake_detail handler", () => {
  it("maps a single cake on success", async () => {
    fetchResponse = jsonResponse({
      _id: "c9",
      nombre: "Choc",
      precio: 30,
      categoria: "chocolate",
      imagen: "http://img/y.jpg",
      disponible: false,
      createdAt: "2024-02-01",
      updatedAt: "2024-02-02",
    });
    const handlers = makeServer();
    const res = (await handlers["get_cake_detail"]({ id: "c9" })) as {
      content: { text: string }[];
    };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.id).toBe("c9");
    expect(parsed.name).toBe("Choc");
  });

  it("returns error content on 404", async () => {
    fetchResponse = jsonResponse({ error: "Not found" }, 404);
    const handlers = makeServer();
    const res = (await handlers["get_cake_detail"]({ id: "nope" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Not found");
  });
});
