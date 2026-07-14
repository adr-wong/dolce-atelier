import { describe, expect, it, mock } from "bun:test";
import crypto from "node:crypto";

process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-oauth-tests";
process.env.MCP_PUBLIC_URL =
  process.env.MCP_PUBLIC_URL || "http://localhost:3002";
process.env.MCP_TOKEN_TTL = "3600";
process.env.FRONTEND_URL =
  process.env.FRONTEND_URL || "https://frontend.example";

// Mock @clerk/backend BEFORE importing the OAuth modules.
const verifyTokenMock = mock(async () => ({ sub: "user_x" }));
mock.module("@clerk/backend", () => ({
  verifyToken: verifyTokenMock,
  createClerkClient: mock(() => ({
    users: {
      getUser: mock(async () => ({ publicMetadata: { role: "user" } })),
    },
  })),
}));

const { generateAuthCode, consumeAuthCode, getClient } = await import(
  "../auth/oauth/codes.js"
);
const { handleRegister } = await import("../auth/oauth/register.js");
const { handleAuthorize, handleApprove } = await import(
  "../auth/oauth/authorize.js"
);
const token = await import("../auth/tokenEndpoint.js");
const issuer = await import("../auth/issuer.js");

// --- shared in-memory fetch mock (single file ⇒ no cross-file race) ---
const CLIENT = {
  client_id: "client_1",
  redirect_uris: ["https://app/cb"],
  scope: "openid",
  client_name: null,
};

type Mode =
  | { clientOk: true }
  | { clientOk: false }
  | { refreshOk: true }
  | { refreshOk: false }
  | { default: true };

function setFetch(mode: Mode) {
  globalThis.fetch = mock(async (url: string, init?: any) => {
    const u = String(url);
    if (u.includes("/api/mcp/oauth/client")) {
      const ok = "clientOk" in mode ? mode.clientOk : true;
      return new Response(JSON.stringify(CLIENT), {
        status: ok ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (u.includes("/api/mcp/oauth/refresh") && init?.method === "GET") {
      const ok = "refreshOk" in mode ? mode.refreshOk : true;
      return new Response(ok ? JSON.stringify({ ok: true }) : "not found", {
        status: ok ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

function s256(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(Buffer.from(verifier))
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function jsonReq(url: string, body: unknown, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}
function tokenReq(body: Record<string, string>): Request {
  return jsonReq("http://localhost/token", body);
}

// ===========================================================================
// codes.ts
// ===========================================================================
describe("codes — auth code lifecycle", () => {
  it("generates and consumes a code once (single-use)", () => {
    const code = generateAuthCode({
      client_id: "client_1",
      redirect_uri: "https://app/cb",
      code_challenge: "challenge",
      userId: "user_1",
      role: "user",
    });
    expect(code.startsWith("mcp_code_")).toBe(true);
    const rec = consumeAuthCode(code);
    expect(rec?.client_id).toBe("client_1");
    expect(rec?.userId).toBe("user_1");
    expect(consumeAuthCode(code)).toBeNull();
  });

  it("returns null for an unknown code", () => {
    expect(consumeAuthCode("mcp_code_does_not_exist")).toBeNull();
  });
});

describe("codes — getClient", () => {
  it("returns the client record when backend responds ok", async () => {
    setFetch({ clientOk: true });
    const client = await getClient("client_1");
    expect(client?.client_id).toBe("client_1");
  });
  it("returns null when backend responds 404", async () => {
    setFetch({ clientOk: false });
    expect(await getClient("missing")).toBeNull();
  });
  it("returns null when fetch throws", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    });
    expect(await getClient("boom")).toBeNull();
  });
});

// ===========================================================================
// register.ts (RFC 7591)
// ===========================================================================
describe("register — RFC 7591", () => {
  it("returns 201 with a public client_id on valid registration", async () => {
    setFetch({ default: true });
    const res = await handleRegister(
      jsonReq("http://localhost/register", {
        redirect_uris: ["https://app/cb"],
        scope: "openid",
        client_name: "Test",
      }),
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as Record<string, unknown>;
    expect(typeof data.client_id).toBe("string");
    expect(data.client_id).toContain("mcp_oauth_");
    expect(data.redirect_uris).toEqual(["https://app/cb"]);
    expect(data.token_endpoint_auth_method).toBe("none");
    expect(data.client_name).toBe("Test");
    expect(data.client_secret).toBeUndefined();
  });

  it("omits client_name when not provided", async () => {
    setFetch({ default: true });
    const res = await handleRegister(
      jsonReq("http://localhost/register", { redirect_uris: ["https://app/cb"] }),
    );
    expect((await res.json()) as Record<string, unknown>).not.toHaveProperty(
      "client_name",
    );
  });

  it("rejects a missing redirect_uri list with 400", async () => {
    const res = await handleRegister(
      jsonReq("http://localhost/register", { client_name: "X" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_redirect_uri",
    );
  });

  it("rejects a non-array redirect_uri with 400", async () => {
    const res = await handleRegister(
      jsonReq("http://localhost/register", { redirect_uris: "nope" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a bad JSON body with 400", async () => {
    const req = new Request("http://localhost/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect((await handleRegister(req)).status).toBe(400);
  });

  it("rejects when the backend rejects persistence (400)", async () => {
    globalThis.fetch = mock(async () => new Response("err", { status: 500 }));
    const res = await handleRegister(
      jsonReq("http://localhost/register", { redirect_uris: ["https://app/cb"] }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_client_metadata",
    );
  });

  it("rejects when the backend is unreachable (400)", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    });
    const res = await handleRegister(
      jsonReq("http://localhost/register", { redirect_uris: ["https://app/cb"] }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 405 for non-POST and 204 for OPTIONS", async () => {
    expect(
      (await handleRegister(new Request("http://localhost/register"))).status,
    ).toBe(405);
    expect(
      (
        await handleRegister(
          new Request("http://localhost/register", { method: "OPTIONS" }),
        )
      ).status,
    ).toBe(204);
  });
});

// ===========================================================================
// authorize.ts
// ===========================================================================
describe("authorize — handleAuthorize (GET /authorize)", () => {
  it("redirects to the frontend consent page with OAuth params", async () => {
    setFetch({ clientOk: true });
    const url =
      "http://localhost/authorize?client_id=client_1&redirect_uri=https://app/cb&response_type=code&scope=openid&code_challenge=abc&code_challenge_method=S256&state=xyz";
    const res = await handleAuthorize(new Request(url));
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location")!;
    expect(loc).toContain("/mcp-authorize?");
    expect(loc).toContain("client_id=client_1");
    expect(loc).toContain("redirect_uri=https%3A%2F%2Fapp%2Fcb");
    expect(loc).toContain("code_challenge=abc");
    expect(loc).toContain("code_challenge_method=S256");
    expect(loc).toContain("state=xyz");
    expect(loc).toContain("scope=openid");
  });

  it("redirects with error when the client is unknown", async () => {
    setFetch({ clientOk: false });
    const url =
      "http://localhost/authorize?client_id=unknown&redirect_uri=https://app/cb&response_type=code&code_challenge=abc&code_challenge_method=S256";
    const res = await handleAuthorize(new Request(url));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=unauthorized_client");
  });

  it("redirects with error for an unregistered redirect_uri", async () => {
    setFetch({ clientOk: true });
    const url =
      "http://localhost/authorize?client_id=client_1&redirect_uri=https://evil/cb&response_type=code&code_challenge=abc&code_challenge_method=S256";
    const res = await handleAuthorize(new Request(url));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=invalid_redirect_uri");
  });

  it("redirects with error when code_challenge is missing", async () => {
    setFetch({ clientOk: true });
    const url =
      "http://localhost/authorize?client_id=client_1&redirect_uri=https://app/cb&response_type=code&code_challenge_method=S256";
    const res = await handleAuthorize(new Request(url));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=invalid_request");
  });

  it("returns 400 when response_type is not 'code'", async () => {
    const res = await handleAuthorize(
      new Request("http://localhost/authorize?response_type=token"),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "unsupported_response_type",
    );
  });

  it("returns 400 when client_id/redirect_uri are missing", async () => {
    const res = await handleAuthorize(
      new Request("http://localhost/authorize?response_type=code"),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_request",
    );
  });
});

describe("authorize — handleApprove (POST /authorize/approve)", () => {
  function approveBody(overrides: Record<string, unknown> = {}) {
    return jsonReq("http://localhost/authorize/approve", {
      clerk_token: "tok",
      client_id: "client_1",
      redirect_uri: "https://app/cb",
      code_challenge: "abc",
      state: "st",
      ...overrides,
    });
  }

  it("issues an auth code on a valid clerk token", async () => {
    setFetch({ clientOk: true });
    const res = await handleApprove(approveBody());
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      redirect_uri: string;
      code: string;
      state: string;
    };
    expect(data.redirect_uri).toBe("https://app/cb");
    expect(data.code.startsWith("mcp_code_")).toBe(true);
    expect(data.state).toBe("st");
  });

  it("returns 401 for an invalid clerk token", async () => {
    setFetch({ clientOk: true });
    verifyTokenMock.mockImplementationOnce(() => {
      throw new Error("bad token");
    });
    const res = await handleApprove(approveBody());
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("returns 400 when a required field is missing", async () => {
    setFetch({ clientOk: true });
    const res = await handleApprove(approveBody({ code_challenge: undefined }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_request",
    );
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await handleApprove(
      new Request("http://localhost/authorize/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 405 for non-POST and 204 for OPTIONS", async () => {
    expect(
      (
        await handleApprove(
          new Request("http://localhost/authorize/approve", { method: "GET" }),
        )
      ).status,
    ).toBe(405);
    expect(
      (
        await handleApprove(
          new Request("http://localhost/authorize/approve", {
            method: "OPTIONS",
          }),
        )
      ).status,
    ).toBe(204);
  });
});

// ===========================================================================
// tokenEndpoint.ts
// ===========================================================================
describe("token — authorization_code grant", () => {
  it("exchanges a valid PKCE code for access + refresh tokens", async () => {
    setFetch({ default: true });
    const verifier = "mcp-verifier-unit-test";
    const code = generateAuthCode({
      client_id: "client_1",
      redirect_uri: "https://app/cb",
      code_challenge: s256(verifier),
      userId: "user_1",
      role: "user",
    });
    const res = await token.handleTokenGrant(
      tokenReq({
        grant_type: "authorization_code",
        code,
        client_id: "client_1",
        redirect_uri: "https://app/cb",
        code_verifier: verifier,
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
    };
    expect(data.access_token).toBeTruthy();
    expect(issuer.verifyMcpToken(data.access_token)?.sub).toBe("user_1");
    expect(data.refresh_token).toBeTruthy();
    expect(data.token_type).toBe("Bearer");
    expect(typeof data.expires_in).toBe("number");
  });

  it("rejects an unknown / consumed code", async () => {
    setFetch({ default: true });
    const res = await token.handleTokenGrant(
      tokenReq({
        grant_type: "authorization_code",
        code: "mcp_code_unknown",
        client_id: "client_1",
        code_verifier: "x",
      }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("rejects a wrong PKCE verifier", async () => {
    setFetch({ default: true });
    const code = generateAuthCode({
      client_id: "client_1",
      redirect_uri: "https://app/cb",
      code_challenge: s256("correct-verifier"),
      userId: "user_1",
      role: "user",
    });
    const res = await token.handleTokenGrant(
      tokenReq({
        grant_type: "authorization_code",
        code,
        client_id: "client_1",
        redirect_uri: "https://app/cb",
        code_verifier: "wrong-verifier",
      }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("rejects a missing client_id", async () => {
    setFetch({ default: true });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "authorization_code", code: "x", code_verifier: "v" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_client",
    );
  });

  it("rejects an unknown client", async () => {
    setFetch({ clientOk: false });
    const res = await token.handleTokenGrant(
      tokenReq({
        grant_type: "authorization_code",
        code: "x",
        client_id: "ghost",
        code_verifier: "v",
      }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_client",
    );
  });

  it("rejects when refresh persistence fails (500)", async () => {
    globalThis.fetch = mock(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/mcp/oauth/client")) {
        return new Response(JSON.stringify(CLIENT), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("err", { status: 500 });
    });
    const verifier = "v-persist";
    const code = generateAuthCode({
      client_id: "client_1",
      redirect_uri: "https://app/cb",
      code_challenge: s256(verifier),
      userId: "user_1",
      role: "user",
    });
    const res = await token.handleTokenGrant(
      tokenReq({
        grant_type: "authorization_code",
        code,
        client_id: "client_1",
        redirect_uri: "https://app/cb",
        code_verifier: verifier,
      }),
    );
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toBe("server_error");
  });
});

describe("token — refresh_token grant", () => {
  it("rotates and issues new tokens for a valid refresh token", async () => {
    setFetch({ default: true });
    const refresh = issuer.signMcpRefreshToken({
      clientId: "client_1",
      userId: "user_2",
      role: "admin",
    });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "refresh_token", refresh_token: refresh }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    expect(data.access_token).toBeTruthy();
    expect(issuer.verifyMcpToken(data.access_token)?.role).toBe("admin");
    expect(data.refresh_token).toBeTruthy();
  });

  it("rejects an invalid refresh token", async () => {
    setFetch({ default: true });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "refresh_token", refresh_token: "garbage" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("rejects a revoked refresh token (lookup not ok)", async () => {
    setFetch({ refreshOk: false });
    const refresh = issuer.signMcpRefreshToken({
      clientId: "client_1",
      userId: "user_2",
      role: "user",
    });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "refresh_token", refresh_token: refresh }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("rejects a missing refresh_token", async () => {
    setFetch({ default: true });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "refresh_token" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_request",
    );
  });
});

describe("token — dispatch + errors", () => {
  it("rejects an unsupported grant type", async () => {
    setFetch({ default: true });
    const res = await token.handleTokenGrant(
      tokenReq({ grant_type: "password" }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "unsupported_grant_type",
    );
  });

  it("rejects a malformed body", async () => {
    setFetch({ default: true });
    const req = new Request("http://localhost/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect((await token.handleTokenGrant(req)).status).toBe(400);
  });
});
