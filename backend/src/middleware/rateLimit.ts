const hits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (val.resetAt < now) hits.delete(key);
  }
}, 300_000);

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max } = opts;

  return async ({ request, set }: { request: Request; set: any }) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const now = Date.now();
    const record = hits.get(ip);

    if (!record || record.resetAt < now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return;
    }

    record.count++;

    if (record.count > max) {
      set.status = 429;
      set.headers = set.headers || {};
      set.headers['Retry-After'] = String(Math.ceil((record.resetAt - now) / 1000));
      return { error: 'Demasiadas solicitudes, intente mas tarde' };
    }
  };
}
