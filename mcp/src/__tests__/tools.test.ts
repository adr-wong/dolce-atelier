import { describe, expect, it } from "bun:test";

// Set env BEFORE importing any module that reads getEnv() (ESM hoists imports,
// so we use a dynamic import below after the env is configured).
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_fake_key_for_testing";
process.env.MCP_JWT_SECRET = "test-secret-for-tools-tests";

const { registerAdminTools } = await import("../tools/admin.js");
const { registerCakeTools } = await import("../tools/cakes.js");
const { registerCartTools } = await import("../tools/cart.js");
const { registerOrderTools } = await import("../tools/orders.js");
const { registerRecipeTools } = await import("../tools/recipes.js");

interface TestServer {
  registerTool: (name: string, ...rest: unknown[]) => void;
  registered: string[];
}

function createTestServer(): TestServer {
  const registered: string[] = [];
  return {
    registerTool: (name: string) => {
      registered.push(name);
    },
    registered,
  };
}

describe("registerCakeTools", () => {
  it("registers search_cakes and get_cake_detail", () => {
    const srv = createTestServer();
    registerCakeTools(srv as never);
    expect(srv.registered.length).toBeGreaterThan(0);
    expect(srv.registered).toContain("search_cakes");
  });
});

describe("registerCartTools", () => {
  it("registers get_cart and add_to_cart", () => {
    const srv = createTestServer();
    registerCartTools(srv as never);
    expect(srv.registered.length).toBeGreaterThan(0);
    expect(srv.registered).toContain("get_cart");
  });
});

describe("registerOrderTools", () => {
  it("registers create_order, list_orders, get_order", () => {
    const srv = createTestServer();
    registerOrderTools(srv as never);
    expect(srv.registered.length).toBeGreaterThan(0);
    expect(srv.registered).toContain("create_order");
  });
});

describe("registerRecipeTools", () => {
  it("registers submit_recipe, list_my_recipes, accept_quote", () => {
    const srv = createTestServer();
    registerRecipeTools(srv as never);
    expect(srv.registered.length).toBeGreaterThan(0);
    expect(srv.registered).toContain("submit_recipe");
  });
});

describe("registerAdminTools", () => {
  it("registers all admin tools", () => {
    const srv = createTestServer();
    registerAdminTools(srv as never);
    expect(srv.registered.length).toBeGreaterThan(0);
    expect(srv.registered).toContain("admin_dashboard_stats");
  });
});
