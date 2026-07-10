import { afterAll, describe, expect, it, mock } from "bun:test";

// Configure env BEFORE importing any module that reads getEnv().
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.MCP_JWT_SECRET = "test-secret";
process.env.MCP_API_KEY = "test-key";

// Avoid any real DNS resolution during SSRF validation in this file.
mock.module("node:dns/promises", () => ({
  lookup: async () => ({ address: "8.8.8.8", family: 4 }),
}));

// Prevent real network by stubbing global fetch (callBackend uses it).
// The upload tool does two fetches: the image URL, then BACKEND_URL/api/upload.
let fetchResponse: Response = new Response("{}", {
  status: 200,
  headers: { "content-type": "application/json" },
});
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
const fetchMock = mock(async (url: string, _opts?: unknown) => {
  if (String(url).includes("/api/upload")) {
    return jsonResponse({ secure_url: "http://up/x.jpg" });
  }
  return fetchResponse;
});
const originalFetch = globalThis.fetch;
// @ts-expect-error override for test
globalThis.fetch = fetchMock;
afterAll(() => {
  // @ts-expect-error restore
  globalThis.fetch = originalFetch;
});

const { registerAdminTools } = await import("../tools/admin.js");

function makeServer() {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, fn: unknown) => {
      handlers[name] = fn as (...a: unknown[]) => unknown;
    },
  } as never;
  registerAdminTools(server);
  return handlers;
}

const authInfo = { userId: "admin-1", role: "admin", token: "admin-token" };

async function runBothWays(
  name: string,
  okArgs: object,
  errArgs: object,
  successData: unknown,
) {
  const handlers = makeServer();
  fetchResponse = jsonResponse(successData);
  const okRes = (await handlers[name](okArgs, { authInfo })) as {
    content: { text: string }[];
  };
  expect(JSON.parse(okRes.content[0].text)).toBeDefined();

  fetchResponse = jsonResponse({ error: "admin fail" }, 500);
  const errRes = (await handlers[name](errArgs, {
    authInfo,
  })) as { isError: boolean; content: { text: string }[] };
  expect(errRes.isError).toBe(true);
}

describe("admin_dashboard_stats", () => {
  it("handles success and failure", async () => {
    await runBothWays(
      "admin_dashboard_stats",
      {},
      {},
      { ordersToday: 3, revenue: 99 },
    );
  });
});

describe("admin_list_cakes", () => {
  it("handles success and failure with params", async () => {
    await runBothWays(
      "admin_list_cakes",
      { search: "choc", page: 2 },
      { search: "choc", page: 2 },
      [{ _id: "a" }],
    );
  });
  it("handles empty params", async () => {
    const handlers = makeServer();
    fetchResponse = jsonResponse([]);
    const res = (await handlers["admin_list_cakes"]({}, {
      authInfo,
    })) as { content: { text: string }[] };
    expect(Array.isArray(JSON.parse(res.content[0].text))).toBe(true);
  });
});

describe("admin_create_cake", () => {
  it("handles success and failure", async () => {
    await runBothWays(
      "admin_create_cake",
      { nombre: "New", precio: 20 },
      { nombre: "New", precio: 20 },
      { _id: "new", nombre: "New" },
    );
  });
});

describe("admin_update_cake", () => {
  it("handles success and failure", async () => {
    await runBothWays(
      "admin_update_cake",
      { id: "c1", nombre: "Upd", precio: 30 },
      { id: "c1", nombre: "Upd", precio: 30 },
      { _id: "c1" },
    );
  });
});

describe("admin_delete_cake", () => {
  it("handles success and failure", async () => {
    await runBothWays(
      "admin_delete_cake",
      { id: "c1" },
      { id: "c1" },
      { deleted: true },
    );
  });
});

describe("admin_list_orders", () => {
  it("handles success and failure with params", async () => {
    await runBothWays(
      "admin_list_orders",
      { status: "PENDIENTE", date: "2024-01-01", page: "1", limit: "10" },
      { status: "PENDIENTE", date: "2024-01-01", page: "1", limit: "10" },
      [{ _id: "o1" }],
    );
  });
  it("handles empty params", async () => {
    const handlers = makeServer();
    fetchResponse = jsonResponse([]);
    const res = (await handlers["admin_list_orders"]({}, {
      authInfo,
    })) as { content: { text: string }[] };
    expect(Array.isArray(JSON.parse(res.content[0].text))).toBe(true);
  });
});

describe("admin_update_order_status", () => {
  it("handles success and failure", async () => {
    await runBothWays(
      "admin_update_order_status",
      { id: "o1", status: "LISTO" },
      { id: "o1", status: "LISTO" },
      { _id: "o1", status: "LISTO" },
    );
  });
});

describe("admin_list_recipes", () => {
  it("handles success and failure", async () => {
    await runBothWays("admin_list_recipes", {}, {}, [{ _id: "r1" }]);
  });
});

describe("admin_quote_recipe", () => {
  it("handles success and failure with body", async () => {
    await runBothWays(
      "admin_quote_recipe",
      { id: "r1", estado: "COTIZADA", cotizacion: 50 },
      { id: "r1", estado: "COTIZADA", cotizacion: 50 },
      { _id: "r1" },
    );
  });
});

describe("admin_upload_image", () => {
  it("rejects disallowed image host (SSRF)", async () => {
    const handlers = makeServer();
    const res = (await handlers["admin_upload_image"](
      { imageUrl: "https://evil.com/x.jpg" },
      { authInfo },
    )) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("rejected");
  });

  it("uploads successfully with an allowed host", async () => {
    const handlers = makeServer();
    // Ensure the image-fetch (non /api/upload URL) returns an OK response.
    fetchResponse = jsonResponse({ ok: true });
    const res = (await handlers["admin_upload_image"](
      { imageUrl: "https://res.cloudinary.com/test/x.jpg" },
      { authInfo },
    )) as { content: { text: string }[] };
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.secure_url).toContain("up/x.jpg");
  });

  it("returns error when the image fetch fails", async () => {
    const handlers = makeServer();
    // Image fetch (non /api/upload URL) returns a non-OK response.
    fetchResponse = new Response("nf", {
      status: 404,
      headers: { "content-type": "text/plain" },
    });
    const res = (await handlers["admin_upload_image"](
      { imageUrl: "https://res.cloudinary.com/test/x.jpg" },
      { authInfo },
    )) as { isError: boolean; content: { text: string }[] };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Failed to fetch image");
  });

  it("returns error when the upload throws", async () => {
    const handlers = makeServer();
    const throwing = mock(async () => {
      throw new Error("net down");
    });
    const saved = globalThis.fetch;
    // @ts-expect-error override for test
    globalThis.fetch = throwing;
    try {
      const res = (await handlers["admin_upload_image"](
        { imageUrl: "https://res.cloudinary.com/test/x.jpg" },
        { authInfo },
      )) as { isError: boolean; content: { text: string }[] };
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Upload failed");
    } finally {
      // @ts-expect-error restore
      globalThis.fetch = saved;
    }
  });
});
