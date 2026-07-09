import { describe, it, expect } from 'bun:test';
import { elysiaAdminGuard } from '../middleware/elysiaAuthAdmin';

// NOTE: The Clerk-dependent branches of verifyElysiaAdmin (success / 403 / invalid
// token) require a live Clerk client and are intentionally NOT exercised here, to
// avoid mocking ../lib/clerk — which would destabilize the shared mcp-keys test
// (that module is already mocked there with specific behaviour). We still cover the
// early-return branches that never reach the network: missing Authorization header
// and a Bearer prefix with no token.

// elysiaAdminGuard is `new Elysia().guard({ beforeHandle })`. Adding the route
// directly on the guard instance ensures the guard's beforeHandle runs for it.
const app = elysiaAdminGuard.get('/', () => 'ok');

describe('elysiaAdminGuard', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 401 when Authorization is a Bearer prefix without a token', async () => {
    const res = await app.handle(
      new Request('http://localhost/', { headers: { Authorization: 'Bearer ' } }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('elysiaAdminGuard export', () => {
  it('exports an Elysia instance', () => {
    expect(elysiaAdminGuard).toBeDefined();
    expect(typeof elysiaAdminGuard.guard).toBe('function');
  });
});
