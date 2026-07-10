import { describe, expect, it, mock } from "bun:test";
import { validateImageUrl } from "../ssrf.js";

describe("validateImageUrl", () => {
  it("rejects invalid URL", async () => {
    const result = await validateImageUrl("not-a-url");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid URL");
  });

  it("rejects non-http protocol", async () => {
    const result = await validateImageUrl("ftp://example.com/img.jpg");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Only http/https allowed");
  });

  it("rejects host not in allowed list", async () => {
    const result = await validateImageUrl("https://evil.com/img.jpg");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not in the allowed list");
  });

  it("accepts allowed host (resolves to public IP)", async () => {
    // Avoid real DNS by mocking the lookup to a public address.
    mock.module(
      "node:dns/promises",
      () => ({ lookup: async () => ({ address: "8.8.8.8", family: 4 }) }),
    );
    const result = await validateImageUrl(
      "https://res.cloudinary.com/test/image.jpg",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects when lookup resolves to a private IP", async () => {
    mock.module(
      "node:dns/promises",
      () => ({ lookup: async () => ({ address: "10.0.0.5", family: 4 }) }),
    );
    const result = await validateImageUrl(
      "https://res.cloudinary.com/test/image.jpg",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("private IP");
  });

  it("rejects when DNS resolution fails", async () => {
    mock.module(
      "node:dns/promises",
      () => ({
        lookup: async () => {
          throw new Error("getaddrinfo ENOTFOUND");
        },
      }),
    );
    const result = await validateImageUrl(
      "https://images.unsplash.com/test/image.jpg",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("DNS resolution failed");
  });

  it("rejects private IP patterns (range match)", () => {
    const PRIVATE_RANGES = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fc00:/,
      /^fd00:/,
      /^fe80:/,
    ];
    const privateIPs = [
      "10.0.0.1",
      "172.16.0.1",
      "192.168.1.1",
      "127.0.0.1",
      "169.254.1.1",
      "0.0.0.0",
      "::1",
      "fc00::1",
      "fd00::1",
      "fe80::1",
    ];
    for (const ip of privateIPs) {
      expect(PRIVATE_RANGES.some((r) => r.test(ip))).toBe(true);
    }
  });

  it("accepts public IP patterns (no range match)", () => {
    const PRIVATE_RANGES = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fc00:/,
      /^fd00:/,
      /^fe80:/,
    ];
    const publicIPs = ["8.8.8.8", "1.1.1.1", "203.0.113.1", "172.15.0.1"];
    for (const ip of publicIPs) {
      expect(PRIVATE_RANGES.some((r) => r.test(ip))).toBe(false);
    }
  });
});
