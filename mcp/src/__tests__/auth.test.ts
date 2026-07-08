import { describe, expect, it, mock } from "bun:test";

// Set env BEFORE any imports
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-auth-tests";
if (!process.env.MCP_API_KEY) {
  process.env.MCP_API_KEY = "test-api-key-123";
}

// Mock @clerk/backend BEFORE importing auth module
mock.module("@clerk/backend", () => ({
  verifyToken: mock(async () => ({ sub: "user_test123" })),
  createClerkClient: mock(() => ({
    users: {
      getUser: mock(async () => ({
        publicMetadata: { role: "user" },
      })),
    },
  })),
}));

const {
  asAuthenticatedUser,
  authenticate,
  requireAuth,
  requireRole,
  validateApiKey,
} = await import("../auth/index.js");
const { getEnv } = await import("../env.js");

const API_KEY = getEnv().MCP_API_KEY ?? "";

describe("validateApiKey", () => {
  it("returns true when API key matches the global key", async () => {
    if (!API_KEY) return;
    expect(await validateApiKey(API_KEY)).toBe(true);
  });

  it("returns false when API key does not match", async () => {
    if (!API_KEY) return;
    expect(await validateApiKey("wrong-key")).toBe(false);
  });

  it("returns false when API key is null", async () => {
    if (!API_KEY) return;
    expect(await validateApiKey(null)).toBe(false);
  });
});

describe("asAuthenticatedUser", () => {
  it("extracts user from valid AuthInfo", () => {
    const authInfo = {
      userId: "user_123",
      role: "user",
    } as unknown as import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo;
    const user = asAuthenticatedUser(authInfo);
    expect(user.userId).toBe("user_123");
    expect(user.role).toBe("user");
  });

  it("throws 401 when userId is missing", () => {
    const authInfo =
      {} as unknown as import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo;
    expect(() => asAuthenticatedUser(authInfo)).toThrow(
      "Authentication required",
    );
  });

  it("throws 401 when authInfo is undefined", () => {
    expect(() => asAuthenticatedUser(undefined)).toThrow(
      "Authentication required",
    );
  });
});

describe("requireRole", () => {
  it("returns user when role is allowed", () => {
    const authInfo = {
      userId: "user_1",
      role: "admin",
    } as unknown as import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo;
    const user = requireRole(authInfo, ["admin", "superadmin"]);
    expect(user.role).toBe("admin");
  });

  it("throws 403 when role is not allowed", () => {
    const authInfo = {
      userId: "user_1",
      role: "user",
    } as unknown as import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo;
    expect(() => requireRole(authInfo, ["admin", "superadmin"])).toThrow(
      "Forbidden",
    );
  });

  it("throws 401 when user is not authenticated", () => {
    expect(() => requireRole(undefined, ["admin"])).toThrow(
      "Authentication required",
    );
  });
});

describe("requireAuth", () => {
  it("returns user when authenticated", () => {
    const authInfo = {
      userId: "user_1",
      role: "user",
    } as unknown as import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo;
    const user = requireAuth(authInfo);
    expect(user.userId).toBe("user_1");
  });

  it("throws when not authenticated", () => {
    expect(() => requireAuth(undefined)).toThrow("Authentication required");
  });
});

describe("authenticate", () => {
  it("rejects invalid API key", async () => {
    if (!API_KEY) return;
    const headers = new Headers({ "X-API-Key": "invalid-key" });
    const result = await authenticate(headers);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("accepts valid API key without JWT", async () => {
    const headers = new Headers({ "X-API-Key": API_KEY || "anything" });
    const result = await authenticate(headers);
    expect("authInfo" in result).toBe(true);
  });

  it("accepts valid API key with JWT", async () => {
    const headers = new Headers({
      "X-API-Key": API_KEY || "anything",
      Authorization: "Bearer fake-jwt-token",
    });
    const result = await authenticate(headers);
    expect("authInfo" in result).toBe(true);
  });
});
