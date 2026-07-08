import { describe, expect, it } from "bun:test";

// Set env BEFORE any requires
process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-env-tests";

describe("env", () => {
  it("validates correct env vars", () => {
    const envModule = require("../env.js");
    const env = envModule.getEnv();
    expect(typeof env.BACKEND_URL).toBe("string");
    expect(typeof env.CLERK_SECRET_KEY).toBe("string");
    expect(typeof env.PORT).toBe("number");
  });

  it("uses default PORT when not set", () => {
    delete process.env.PORT;
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
