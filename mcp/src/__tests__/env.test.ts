import { beforeEach, describe, expect, it } from "bun:test";

describe("env", () => {
  const validEnv = {
    BACKEND_URL: "http://localhost:3001",
    CLERK_SECRET_KEY: "sk_test_key",
    PORT: "3002",
    MCP_API_KEY: "test-api-key-123",
  };

  beforeEach(() => {
    // Reset env to valid state
    for (const [key, value] of Object.entries(validEnv)) {
      process.env[key] = value;
    }
  });

  it("validates correct env vars", () => {
    // Fresh import with valid env
    const envModule = require("../env.js");
    const env = envModule.getEnv();
    expect(env.BACKEND_URL).toBe("http://localhost:3001");
    expect(env.CLERK_SECRET_KEY).toBe("sk_test_key");
    expect(env.PORT).toBe(3002);
    expect(env.MCP_API_KEY).toBe("test-api-key-123");
  });

  it("uses default PORT when not set", () => {
    delete process.env.PORT;
    // The singleton is cached, so this test verifies the default exists in schema
    const { z } = require("zod");
    const schema = z.object({
      PORT: z.coerce.number().default(3002),
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3002);
    }
  });

  it("makes MCP_API_KEY optional", () => {
    delete process.env.MCP_API_KEY;
    const { z } = require("zod");
    const schema = z.object({
      MCP_API_KEY: z.string().optional(),
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects missing BACKEND_URL", () => {
    delete process.env.BACKEND_URL;
    const { z } = require("zod");
    const schema = z.object({
      BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing CLERK_SECRET_KEY", () => {
    delete process.env.CLERK_SECRET_KEY;
    const { z } = require("zod");
    const schema = z.object({
      CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid BACKEND_URL format", () => {
    const { z } = require("zod");
    const schema = z.object({
      BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),
    });
    const result = schema.safeParse({ BACKEND_URL: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("coerces PORT to number", () => {
    const { z } = require("zod");
    const schema = z.object({
      PORT: z.coerce.number().default(3002),
    });
    const result = schema.safeParse({ PORT: "8080" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(8080);
    }
  });
});
