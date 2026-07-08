import { exchangeMcpToken, buildOpencodeSnippet } from "../mcpAuth";

describe("mcpAuth", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("exchangeMcpToken", () => {
    it("exchanges a Clerk token for an MCP JWT", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "jwt-123",
          token_type: "Bearer",
          expires_in: 3600,
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const res = await exchangeMcpToken("clerk-token", "http://localhost:3002");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3002/token",
        expect.objectContaining({ method: "POST" }),
      );
      expect(res.access_token).toBe("jwt-123");
      expect(res.expires_in).toBe(3600);
    });

    it("strips trailing slashes from the MCP url", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "jwt", expires_in: 1 }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      await exchangeMcpToken("clerk-token", "http://mcp.example.com/");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://mcp.example.com/token",
        expect.anything(),
      );
    });

    it("throws on an error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: "invalid_grant",
          error_description: "Clerk token verification failed",
        }),
      }) as unknown as typeof fetch;

      await expect(exchangeMcpToken("bad", "http://mcp")).rejects.toThrow(
        "Clerk token verification failed",
      );
    });

    it("throws on a non-JSON body", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      }) as unknown as typeof fetch;

      await expect(exchangeMcpToken("x", "http://mcp")).rejects.toThrow(
        "Error 500",
      );
    });
  });

  describe("buildOpencodeSnippet", () => {
    it("builds a valid opencode.json snippet", () => {
      const snippet = buildOpencodeSnippet({
        mcpUrl: "http://localhost:3002/",
        apiKey: "KEY",
        jwt: "JWT",
      });
      const parsed = JSON.parse(snippet);
      const cfg = parsed.mcp["dolce-atelier"];
      expect(cfg.url).toBe("http://localhost:3002/mcp");
      expect(cfg.headers["X-API-Key"]).toBe("KEY");
      expect(cfg.headers.Authorization).toBe("Bearer JWT");
    });
  });
});
