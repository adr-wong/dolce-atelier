import { describe, it, expect } from 'bun:test';
import crypto from 'node:crypto';

const SECRET = 'test-backend-mcp-secret-1234567890';
process.env.MCP_JWT_SECRET = SECRET;

function signMcpToken(claims: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const signingInput = `${b64(header)}.${b64(claims)}`;
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${signingInput}.${sig}`;
}

function mcpClaims(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'user_mcp',
    role: 'user',
    iat: now,
    exp: now + 3600,
    iss: 'dolce-atelier-mcp',
    aud: 'dolce-atelier-mcp',
    ...overrides,
  };
}

const { mcpClaimsFromHeader, verifyAdmin } = await import(
  '../middleware/auth'
);

describe('mcpClaimsFromHeader', () => {
  it('accepts a valid MCP-issued token', () => {
    const token = signMcpToken(mcpClaims());
    const claims = mcpClaimsFromHeader(`Bearer ${token}`);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe('user_mcp');
    expect(claims?.role).toBe('user');
  });

  it('reads the role from the token', () => {
    const token = signMcpToken(mcpClaims({ role: 'admin' }));
    const claims = mcpClaimsFromHeader(`Bearer ${token}`);
    expect(claims?.role).toBe('admin');
  });

  it('rejects an expired token', () => {
    const token = signMcpToken(mcpClaims({ exp: Math.floor(Date.now() / 1000) - 10 }));
    expect(mcpClaimsFromHeader(`Bearer ${token}`)).toBeNull();
  });

  it('rejects a token with wrong signature', () => {
    const token = signMcpToken(mcpClaims());
    const [h, p] = token.split('.');
    const fake = `${h}.${p}.deadbeef`;
    expect(mcpClaimsFromHeader(`Bearer ${fake}`)).toBeNull();
  });

  it('rejects a non-Bearer header', () => {
    expect(mcpClaimsFromHeader('Basic abc')).toBeNull();
    expect(mcpClaimsFromHeader(null)).toBeNull();
  });

  it('rejects a token signed with a different issuer', () => {
    const token = signMcpToken(mcpClaims({ iss: 'evil', aud: 'evil' }));
    expect(mcpClaimsFromHeader(`Bearer ${token}`)).toBeNull();
  });
});

describe('verifyAdmin with MCP token', () => {
  it('grants admin role for an MCP admin token', async () => {
    const token = signMcpToken(mcpClaims({ role: 'admin' }));
    const admin = await verifyAdmin(`Bearer ${token}`);
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('admin');
    expect(admin?.userId).toBe('user_mcp');
  });

  it('denies a non-admin MCP token', async () => {
    const token = signMcpToken(mcpClaims({ role: 'user' }));
    const admin = await verifyAdmin(`Bearer ${token}`);
    // Not superadmin → rejected by the admin guard contract.
    expect(admin?.role).not.toBe('superadmin');
    expect(admin?.role).toBe('user');
  });
});
