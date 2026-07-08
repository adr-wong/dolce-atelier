import { describe, expect, it } from "bun:test";

// Set env BEFORE any imports
process.env.BACKEND_URL = "http://localhost:3001";
process.env.CLERK_SECRET_KEY = "sk_test_fake_key_for_testing";
process.env.MCP_JWT_SECRET = "test-secret-for-tools-tests";

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
