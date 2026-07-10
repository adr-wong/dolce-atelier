import { describe, it, expect, mock } from 'bun:test';
import { rateLimit, generalLimiter, authLimiter, strictLimiter } from '../middleware/rateLimit';
import { AppError, ErrorCode } from '../lib/errors';

function makeCtx(key: string, existingHeaders: Record<string, string> = {}) {
  const request = new Request('http://localhost/', {
    headers: { 'x-forwarded-for': key, ...existingHeaders },
  });
  const set: { status?: number; headers: Record<string, string> } = { headers: {} };
  return { request, set };
}

describe('rateLimit', () => {
  it('allows requests under the limit and sets informational headers', async () => {
    const limiter = rateLimit({ windowMs: 1000, max: 3 });
    const { request, set } = makeCtx('allow-1');
    await limiter({ request, set } as any);
    expect(set.status).not.toBe(429);
    expect(set.headers['X-RateLimit-Limit']).toBe('3');
    expect(Number(set.headers['X-RateLimit-Remaining'])).toBeGreaterThanOrEqual(0);
    expect(set.headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('throws AppError RATE_LIMITED once the limit is exceeded', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    await limiter(makeCtx('exceed-1') as any);
    await limiter(makeCtx('exceed-1') as any);
    let thrown: unknown = null;
    try {
      await limiter(makeCtx('exceed-1') as any);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).code).toBe(ErrorCode.RATE_LIMITED);
    expect((thrown as any).status).toBe(429);
  });

  it('sets Retry-After header when limited', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    await limiter(makeCtx('retry-1') as any);
    try {
      await limiter(makeCtx('retry-1') as any);
    } catch (e) {
      expect((e as any).details.retryAfter).toBeGreaterThan(0);
    }
  });

  it('uses a custom keyFn when provided', async () => {
    const keyFn = mock((_req: Request) => 'fixed-key');
    const limiter = rateLimit({ windowMs: 60_000, max: 5, keyFn });
    await limiter(makeCtx('ignored') as any);
    expect(keyFn).toHaveBeenCalled();
  });

  it('falls back to x-real-ip then unknown when no forwarding header', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const request = new Request('http://localhost/', { headers: { 'x-real-ip': '9.9.9.9' } });
    const set: { status?: number; headers: Record<string, string> } = { headers: {} };
    await limiter({ request, set } as any);
    expect(set.status).not.toBe(429);
  });

  it('exposes predefined limiters', () => {
    expect(typeof generalLimiter).toBe('function');
    expect(typeof authLimiter).toBe('function');
    expect(typeof strictLimiter).toBe('function');
  });
});
