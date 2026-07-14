import { describe, expect, it } from "bun:test";
import crypto from "node:crypto";

process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-issuer-tests";

const issuer = await import("../auth/issuer.js");

describe("issuer — access token", () => {
  it("roundtrips a signed access token", () => {
    const token = issuer.signMcpToken({ userId: "user_1", role: "user" });
    const claims = issuer.verifyMcpToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user_1");
    expect(claims?.role).toBe("user");
    expect(claims?.iss).toBe("dolce-atelier-mcp");
    expect(claims?.aud).toBe("dolce-atelier-mcp");
  });

  it("roundtrips an admin token", () => {
    const token = issuer.signMcpToken({ userId: "admin_1", role: "superadmin" });
    const claims = issuer.verifyMcpToken(token);
    expect(claims?.role).toBe("superadmin");
  });

  it("honours a custom ttl", () => {
    const token = issuer.signMcpToken({
      userId: "u",
      role: "user",
      ttlSeconds: 10,
    });
    expect(issuer.verifyMcpToken(token)?.exp).toBeGreaterThan(
      Math.floor(Date.now() / 1000),
    );
  });

  it("rejects a tampered signature", () => {
    const token = issuer.signMcpToken({ userId: "u", role: "user" });
    const [h, p] = token.split(".");
    expect(issuer.verifyMcpToken(`${h}.${p}.deadbeef`)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(issuer.verifyMcpToken("not.a.jwt")).toBeNull();
    expect(issuer.verifyMcpToken("garbage")).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = issuer.signMcpToken({
      userId: "u",
      role: "user",
      ttlSeconds: -10,
    });
    expect(issuer.verifyMcpToken(token)).toBeNull();
  });
});

describe("issuer — refresh token", () => {
  it("roundtrips a signed refresh token", () => {
    const token = issuer.signMcpRefreshToken({
      clientId: "client_1",
      userId: "user_1",
      role: "user",
    });
    const claims = issuer.verifyMcpRefreshToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user_1");
    expect(claims?.clientId).toBe("client_1");
    expect(claims?.purpose).toBe("refresh");
  });

  it("rejects a malformed refresh token", () => {
    expect(issuer.verifyMcpRefreshToken("a.b.c.d")).toBeNull();
    expect(issuer.verifyMcpRefreshToken("nope")).toBeNull();
  });

  it("rejects an expired refresh token", () => {
    const token = issuer.signMcpRefreshToken({
      clientId: "client_1",
      userId: "user_1",
      role: "user",
      ttlSeconds: -10,
    });
    expect(issuer.verifyMcpRefreshToken(token)).toBeNull();
  });
});

describe("issuer — resolveClerkRole", () => {
  it("maps admin and superadmin", () => {
    expect(issuer.resolveClerkRole({ publicMetadata: { role: "admin" } })).toBe(
      "admin",
    );
    expect(
      issuer.resolveClerkRole({ publicMetadata: { role: "superadmin" } }),
    ).toBe("superadmin");
  });

  it("defaults everything else to user", () => {
    expect(issuer.resolveClerkRole({ publicMetadata: { role: "user" } })).toBe(
      "user",
    );
    expect(issuer.resolveClerkRole({ publicMetadata: {} })).toBe("user");
    expect(issuer.resolveClerkRole({ publicMetadata: null })).toBe("user");
    expect(issuer.resolveClerkRole({})).toBe("user");
    expect(issuer.resolveClerkRole({ publicMetadata: { role: "bogus" } })).toBe(
      "user",
    );
  });
});
