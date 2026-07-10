import { AppError, ErrorCode } from '../lib/errors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Limpieza cada 5 minutos para no acumular memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 300_000);

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (request: Request) => string;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, keyFn } = opts;

  return async ({ request, set }: { request: Request; set: any }) => {
    const key = keyFn
      ? keyFn(request)
      : request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    const now = Date.now();
    let record = store.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    // Siempre agregar headers informativos
    set.headers = {
      ...set.headers,
      'X-RateLimit-Limit': String(max),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
    };

    if (record.count > max) {
      set.status = 429;
      set.headers['Retry-After'] = String(resetSeconds);
      throw new AppError(
        ErrorCode.RATE_LIMITED,
        `Demasiadas solicitudes. Reintente en ${resetSeconds} segundos.`,
        { retryAfter: resetSeconds }
      );
    }
  };
}

// Rate limiters predefinidos para distintos contextos
export const generalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
export const authLimiter = rateLimit({ windowMs: 900_000, max: 5 });
export const strictLimiter = rateLimit({ windowMs: 60_000, max: 10 });
