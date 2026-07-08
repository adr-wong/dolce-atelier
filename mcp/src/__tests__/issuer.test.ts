import { describe, expect, it } from "bun:test";

process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-issuer-tests";

const { signMcpToken, verifyMcpToken } = await import("../auth/issuer.js");

describe("issuer", () => {
  it("round-trips a signed token", () => {
    const token = signMcpToken({ userId: "user_123", role: "user" });
    const claims = verifyMcpToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user_123");
    expect(claims?.role).toBe("user");
    expect(claims?.iss).toBe("dolce-atelier-mcp");
  });

  it("rejects a tampered token", () => {
    const token = signMcpToken({ userId: "user_123", role: "user" });
    const tampered = `${token.slice(0, -2)}aa`;
    expect(verifyMcpToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signMcpToken({
      userId: "user_123",
      role: "user",
      ttlSeconds: -10,
    });
    expect(verifyMcpToken(token)).toBeNull();
  });

  it("rejects a random non-JWT string", () => {
    expect(
      verifyMcpToken("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.abc"),
    ).toBeNull();
  });

  it("carries admin role", () => {
    const token = signMcpToken({ userId: "user_admin", role: "admin" });
    expect(verifyMcpToken(token)?.role).toBe("admin");
  });
});
