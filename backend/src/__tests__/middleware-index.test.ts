import { describe, it, expect } from 'bun:test';

// Re-exports the auth middleware surface (mcpClaimsFromHeader, verifyToken, etc.)
const authExports = await import('../middleware/auth');
const indexExports = await import('../middleware/index');

describe('middleware/index re-exports', () => {
  it('re-exports mcpClaimsFromHeader from auth', () => {
    expect(indexExports.mcpClaimsFromHeader).toBe(authExports.mcpClaimsFromHeader);
  });

  it('re-exports verifyToken from auth', () => {
    expect(indexExports.verifyToken).toBe(authExports.verifyToken);
  });

  it('re-exports verifyAdmin from auth', () => {
    expect(indexExports.verifyAdmin).toBe(authExports.verifyAdmin);
  });

  it('re-exports authMiddleware from auth', () => {
    expect(indexExports.authMiddleware).toBe(authExports.authMiddleware);
  });
});
