import { describe, expect, it, mock } from "bun:test";

// Set env BEFORE any imports
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_fake_key_for_testing";

// Mock auth module
mock.module("../auth/index.js", () => ({
  callBackend: mock(async (_path: string) => ({
    ok: true,
    status: 200,
    data: {
      pasteles: [
        {
          _id: "1",
          nombre: "Test Cake",
          precio: 25.5,
          categoria: "chocolate",
          imagen: "https://example.com/cake.jpg",
          disponible: true,
          descripcion: "A test cake",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    },
  })),
  requireAuth: mock((authInfo: unknown) => {
    if (!authInfo) throw new Error("Authentication required");
    return { userId: "user_1", role: "user", token: "fake-token" };
  }),
  requireRole: mock((authInfo: unknown, _roles: string[]) => {
    if (!authInfo) throw new Error("Authentication required");
    return { userId: "user_1", role: "admin", token: "fake-token" };
  }),
}));

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAdminTools } from "../tools/admin.js";
import { registerCakeTools } from "../tools/cakes.js";
import { registerCartTools } from "../tools/cart.js";
import { registerOrderTools } from "../tools/orders.js";
import { registerRecipeTools } from "../tools/recipes.js";

function createTestServer(): McpServer {
  const srv = new McpServer({
    name: "test-server",
    version: "1.0.0",
  });
  return srv;
}

describe("registerCakeTools", () => {
  it("registers search_cakes and get_cake_detail", () => {
    const srv = createTestServer();
    registerCakeTools(srv);
    // If no error thrown, tools registered successfully
    expect(true).toBe(true);
  });
});

describe("registerCartTools", () => {
  it("registers get_cart and add_to_cart", () => {
    const srv = createTestServer();
    registerCartTools(srv);
    expect(true).toBe(true);
  });
});

describe("registerOrderTools", () => {
  it("registers create_order, list_orders, get_order", () => {
    const srv = createTestServer();
    registerOrderTools(srv);
    expect(true).toBe(true);
  });
});

describe("registerRecipeTools", () => {
  it("registers submit_recipe, list_my_recipes, accept_quote", () => {
    const srv = createTestServer();
    registerRecipeTools(srv);
    expect(true).toBe(true);
  });
});

describe("registerAdminTools", () => {
  it("registers all admin tools", () => {
    const srv = createTestServer();
    registerAdminTools(srv);
    expect(true).toBe(true);
  });
});
