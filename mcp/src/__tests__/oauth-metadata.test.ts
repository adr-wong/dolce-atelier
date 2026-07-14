import { describe, expect, it } from "bun:test";

process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_placeholder";
process.env.MCP_JWT_SECRET =
  process.env.MCP_JWT_SECRET || "test-secret-for-metadata-tests";
process.env.MCP_PUBLIC_URL =
  process.env.MCP_PUBLIC_URL || "http://localhost:3002";

const { metadataRoutes } = await import("../auth/oauth/metadata.js");

function req(path: string, method = "GET"): Request {
  return new Request(`http://localhost${path}`, { method });
}

describe("metadata — protected resource", () => {
  it("returns RFC 8414 protected-resource metadata", async () => {
    const res = await metadataRoutes(req("/.well-known/oauth-protected-resource"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    const data = (await res!.json()) as Record<string, unknown>;
    expect(data.resource).toBe("http://localhost:3002");
    expect(data.authorization_servers).toEqual(["http://localhost:3002"]);
    expect(data.scopes_supported).toEqual(["openid", "profile", "email"]);
    expect(data.bearer_methods_supported).toEqual(["header"]);
    expect(data.resource_signing_alg_values_supported).toEqual(["RS256"]);
  });
});

describe("metadata — authorization server", () => {
  it("returns RFC 8414 authorization-server metadata", async () => {
    const res = await metadataRoutes(
      req("/.well-known/oauth-authorization-server"),
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    const data = (await res!.json()) as Record<string, unknown>;
    expect(data.issuer).toBe("http://localhost:3002");
    expect(data.authorization_endpoint).toBe("http://localhost:3002/authorize");
    expect(data.token_endpoint).toBe("http://localhost:3002/token");
    expect(data.registration_endpoint).toBe("http://localhost:3002/register");
    expect(data.response_types_supported).toEqual(["code"]);
    expect(data.grant_types_supported).toEqual([
      "authorization_code",
      "refresh_token",
    ]);
    expect(data.token_endpoint_auth_methods_supported).toEqual(["none"]);
    expect(data.code_challenge_methods_supported).toEqual(["S256"]);
  });
});

describe("metadata — routing", () => {
  it("returns 204 for OPTIONS", () => {
    const res = metadataRoutes(req("/.well-known/oauth-authorization-server", "OPTIONS"));
    expect(res!.status).toBe(204);
  });

  it("returns null for non-GET methods", () => {
    expect(metadataRoutes(req("/.well-known/oauth-authorization-server", "POST"))).toBeNull();
  });

  it("returns null for unknown paths", () => {
    expect(metadataRoutes(req("/.well-known/unknown"))).toBeNull();
  });
});
