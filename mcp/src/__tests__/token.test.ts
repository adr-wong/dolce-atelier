import { describe, expect, it, mock } from "bun:test";

// Env must be set before importing the module under test.
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-token-tests";
process.env.MCP_CLIENTS = JSON.stringify([
  {
    client_id: "mcp_demo",
    client_secret: "demo-secret",
    userId: "user_demo",
    role: "user",
  },
]);

// Mock @clerk/backend BEFORE importing the token endpoint.
mock.module("@clerk/backend", () => ({
  verifyToken: mock(async (token?: string) =>
    token && !token.includes("bad") ? { sub: "user_clerk" } : null,
  ),
  createClerkClient: mock(() => ({
    users: {
      getUser: mock(async () => ({
        publicMetadata: { role: "admin" },
      })),
    },
  })),
}));

const tokenEndpoint = await import("../auth/tokenEndpoint.js");
const { verifyMcpToken } = await import("../auth/issuer.js");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("token endpoint — client_credentials", () => {
  it("issues an agent token for valid client", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({
        grant_type: "client_credentials",
        client_id: "mcp_demo",
        client_secret: "demo-secret",
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };
    expect(data.token_type).toBe("Bearer");
    expect(data.expires_in).toBeGreaterThan(0);
    const claims = verifyMcpToken(data.access_token);
    expect(claims?.sub).toBe("user_demo");
    expect(claims?.role).toBe("user");
  });

  it("rejects a bad secret", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({
        grant_type: "client_credentials",
        client_id: "mcp_demo",
        client_secret: "wrong",
      }),
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_client");
  });

  it("rejects an unknown client", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({
        grant_type: "client_credentials",
        client_id: "nope",
        client_secret: "nope",
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("token endpoint — clerk_exchange", () => {
  it("exchanges a Clerk token for an agent token (with role)", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({
        grant_type: "clerk_exchange",
        clerk_token: "clerk.jwt.token",
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { access_token: string };
    const claims = verifyMcpToken(data.access_token);
    expect(claims?.sub).toBe("user_clerk");
    expect(claims?.role).toBe("admin");
  });

  it("rejects a missing clerk_token", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({ grant_type: "clerk_exchange" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid Clerk token", async () => {
    const res = await tokenEndpoint.handleTokenGrant(
      jsonRequest({
        grant_type: "clerk_exchange",
        clerk_token: "bad",
      }),
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_grant");
  });
});

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

  it("parses form-urlencoded bodies", async () => {
    const req = new Request("http://localhost/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&client_id=mcp_demo&client_secret=demo-secret",
    });
    const res = await tokenEndpoint.handleTokenGrant(req);
    expect(res.status).toBe(200);
  });
});

describe("token UI + CORS", () => {
  it("serves an HTML token UI", () => {
    const res = tokenEndpoint.tokenUiResponse();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

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
