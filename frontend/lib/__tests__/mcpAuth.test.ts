import {
  exchangeMcpToken,
  buildOpencodeSnippet,
  createMcpSession,
  listMcpSessions,
  revokeMcpSession,
} from "../mcpAuth";

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

  describe("createMcpSession", () => {
    it("POSTs to /api/mcp/sessions and returns the token", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "sess_1",
          token: "mcp_sess_abc",
          label: "opencode",
          createdAt: "2026-01-01T00:00:00Z",
          expiresAt: "2026-01-01T08:00:00Z",
          last4: "s_abc",
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const res = await createMcpSession("clerk-token", "http://localhost:3002", "opencode");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3002/api/mcp/sessions",
        expect.objectContaining({ method: "POST" }),
      );
      const opts = mockFetch.mock.calls[0][1];
      expect(opts.headers.Authorization).toBe("Bearer clerk-token");
      expect(JSON.parse(opts.body)).toEqual({ label: "opencode" });
      expect(res.token).toBe("mcp_sess_abc");
    });

    it("throws on an error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "No autenticado" }),
      }) as unknown as typeof fetch;

      await expect(
        createMcpSession("bad", "http://mcp"),
      ).rejects.toThrow("No autenticado");
    });
  });

  describe("listMcpSessions", () => {
    it("GETs /api/mcp/sessions with the bearer token", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          sessions: [
            {
              id: "sess_1",
              label: "opencode",
              createdAt: "2026-01-01T00:00:00Z",
              expiresAt: "2026-01-01T08:00:00Z",
              last4: "s_abc",
              revoked: false,
            },
          ],
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const res = await listMcpSessions("clerk-token", "http://localhost:3002");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3002/api/mcp/sessions",
        expect.objectContaining({ method: "GET" }),
      );
      const opts = mockFetch.mock.calls[0][1];
      expect(opts.headers.Authorization).toBe("Bearer clerk-token");
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe("sess_1");
    });

    it("throws on an error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "fail" }),
      }) as unknown as typeof fetch;

      await expect(listMcpSessions("x", "http://mcp")).rejects.toThrow("fail");
    });
  });

  describe("revokeMcpSession", () => {
    it("DELETEs /api/mcp/sessions/:id", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      await revokeMcpSession("clerk-token", "http://localhost:3002", "sess_1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3002/api/mcp/sessions/sess_1",
        expect.objectContaining({ method: "DELETE" }),
      );
      const opts = mockFetch.mock.calls[0][1];
      expect(opts.headers.Authorization).toBe("Bearer clerk-token");
    });

    it("throws on an error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "no encontrada" }),
      }) as unknown as typeof fetch;

      await expect(
        revokeMcpSession("x", "http://mcp", "sess_x"),
      ).rejects.toThrow("no encontrada");
    });
  });
});
