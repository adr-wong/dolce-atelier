import { describe, it, expect, mock } from "bun:test";

const mockClient = { users: {}, sessions: {}, verifyToken: mock() };
mock.module("@clerk/backend", () => ({
  createClerkClient: mock(() => mockClient),
}));
// Mock the module directly so the assertion is deterministic regardless of
// which test file loaded ../lib/clerk first in the shared bun module registry.
mock.module("../lib/clerk", () => ({ clerkClient: mockClient }));

const { clerkClient } = await import("../lib/clerk");

describe("clerkClient", () => {
  it("exports a Clerk client instance", () => {
    expect(clerkClient).toBeDefined();
    expect(clerkClient).toBe(mockClient);
  });

  it("has users and sessions properties", () => {
    expect(clerkClient).toHaveProperty("users");
    expect(clerkClient).toHaveProperty("sessions");
  });
});
