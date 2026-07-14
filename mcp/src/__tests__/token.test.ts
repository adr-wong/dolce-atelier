import { describe, expect, it } from "bun:test";

// Env must be set before importing the module under test.
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-token-tests";

const tokenEndpoint = await import("../auth/tokenEndpoint.js");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("token endpoint — errors", () => {
  it("rejects an unsupported grant type", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({ grant_type: "password" }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("unsupported_grant_type");
  });

  it("rejects a malformed body", async () => {
    const req = new Request("http://localhost/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const res = await tokenEndpoint.handleTokenGrant(req);
    expect(res.status).toBe(400);
  });

});

describe("token CORS", () => {
  it("corsResponse adds CORS headers", () => {
    const inner = new Response("{}", {
      headers: { "Content-Type": "application/json" },
    });
    const out = tokenEndpoint.corsResponse(inner);
    expect(out.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("corsResponse returns 204 for null body", () => {
    const out = tokenEndpoint.corsResponse(null);
    expect(out.status).toBe(204);
    expect(out.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
