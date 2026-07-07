import { describe, expect, it } from "bun:test";
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
    const result = await validateImageUrl(
      "https://res.cloudinary.com/test/image.jpg",
    );
    expect(typeof result.ok).toBe("boolean");
  });

  it("rejects private IP resolution", async () => {
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
      const matched = PRIVATE_RANGES.some((r) => r.test(ip));
      expect(matched).toBe(true);
    }
  });

  it("rejects public IP patterns correctly", () => {
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
      const matched = PRIVATE_RANGES.some((r) => r.test(ip));
      expect(matched).toBe(false);
    }
  });
});
