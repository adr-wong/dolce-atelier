# Dolce Atelier — Implementación 42 HU Production-Ready

> **Para agentes:** Usar `executing-plans` para implementar este plan fase por fase. Los checkboxes (`- [ ]`) son para tracking.

**Goal:** Implementar las 42 historias de usuario basadas en retroalimentación del profesor en el proyecto semestral Dolce Atelier.

**Architecture:** Next.js 14 (App Router) + Elysia/Bun + MongoDB/Mongoose + Clerk + Stripe + Cloudinary. Backend en capas (routes/services/models/middleware), frontend con Server Components por defecto.

**Tech Stack:** Bun, Elysia, Mongoose, Zod, Next.js 14, React 18, Zustand, CSS Modules, Clerk, Stripe, Cloudinary, Resend

## Global Constraints

- NO usar `any` en TypeScript
- TODA request validada con Zod
- NUNCA lógica de negocio en frontend
- Stripe SOLO desde backend
- NO exponer variables sensibles en frontend
- SSR obligatorio en catálogo
- Código modular, sin duplicación
- Tests con bun test (backend), jest (frontend)

---

## Auditoría Previa

| Estado | Cantidad | HUs |
|--------|----------|-----|
| ✅ Parcialmente implementado | 7 | HU-001, HU-003, HU-010, HU-011, HU-015, HU-021, HU-033 |
| ❌ No implementado | 35 | Resto |

---

# FASE 1: Fundaciones (infraestructura crítica)

> Estas HUs son prerequisito para el resto. Sin error handling consistente y rate limiting bien implementado, todo lo demás es frágil.

---

### Task 1.1: HU-003 — Manejo Global de Errores con Códigos Consistentes

**Files:**
- Modify: `semestral/backend/src/server.ts` (onError handler)
- Create: `semestral/backend/src/lib/errors.ts`
- Modify: `semestral/backend/src/middleware/auth.ts`
- Modify: `semestral/backend/src/routes/*.ts` (apply consistent errors)

**Interfaces:**
- Produces: `AppError` class with `{ code: string, status: number, message: string }`
- Produces: `errorCodes` enum: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`

- [ ] **Step 1: Crear `src/lib/errors.ts` con clases de error tipadas**

```typescript
// semestral/backend/src/lib/errors.ts
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
  STRIPE_ERROR: 'STRIPE_ERROR',
  IDEMPOTENCY_ERROR: 'IDEMPOTENCY_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  IDEMPOTENCY_ERROR: 409,
  STRIPE_ERROR: 502,
  INTERNAL: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_MAP[code];
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}
```

- [ ] **Step 2: Actualizar `onError` en server.ts para usar AppError**

En `semestral/backend/src/server.ts`, reemplazar el bloque `.onError`:

```typescript
.onError(({ code, error, set }) => {
  if (error instanceof AppError) {
    set.status = error.status;
    return error.toJSON();
  }

  logger.error('Unhandled error', {
    code,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  if (code === 'NOT_FOUND') {
    set.status = 404;
    return { error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } };
  }

  if (error.message?.includes('validation')) {
    set.status = 400;
    return { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.message } };
  }

  set.status = 500;
  return { error: { code: 'INTERNAL', message: 'Error interno del servidor' } };
})
```

- [ ] **Step 3: Agregar import de AppError en server.ts**

```typescript
import { AppError, ErrorCode } from './lib/errors';
```

- [ ] **Step 4: Escribir test de errores**

```typescript
// semestral/backend/src/__tests__/errors.test.ts
import { describe, it, expect } from 'bun:test';
import { AppError, ErrorCode } from '../lib/errors';

describe('AppError', () => {
  it('creates error with correct status code', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'No encontrado');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('serializes to JSON correctly', () => {
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'Datos inválidos', { field: 'email' });
    const json = err.toJSON();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.details).toEqual({ field: 'email' });
  });

  it('maps all error codes to valid HTTP status', () => {
    for (const code of Object.values(ErrorCode)) {
      const err = new AppError(code, 'test');
      expect(err.status).toBeGreaterThanOrEqual(400);
    }
  });
});
```

- [ ] **Step 5: Correr tests y verificar**

```bash
cd semestral/backend && bun test
```

- [ ] **Step 6: Commit**

```bash
git add semestral/backend/src/lib/errors.ts semestral/backend/src/server.ts semestral/backend/src/__tests__/errors.test.ts
git commit -m "feat(HU-003): manejo global de errores con AppError y códigos consistentes"
```

---

### Task 1.2: HU-010 — Rate Limiting con Headers Completos

**Files:**
- Modify: `semestral/backend/src/middleware/rateLimit.ts`
- Modify: `semestral/backend/src/server.ts` (aplicar rate limit con headers)

**Interfaces:**
- Consumes: `AppError` de Task 1.1
- Produces: `rateLimit()` retorna headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

- [ ] **Step 1: Reescribir rateLimit con headers completos**

```typescript
// semestral/backend/src/middleware/rateLimit.ts
import { AppError, ErrorCode } from '../lib/errors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Limpieza cada 5 minutos
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

    // Siempre agregar headers
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

// Rate limiters predefinidos
export const generalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
export const authLimiter = rateLimit({ windowMs: 900_000, max: 5 }); // 5 intentos cada 15 min
export const strictLimiter = rateLimit({ windowMs: 60_000, max: 10 }); // 10 req/min para endpoints sensibles
```

- [ ] **Step 2: Aplicar rate limiters específicos en server.ts**

En `semestral/backend/src/server.ts`, reemplazar el rate limit general:

```typescript
import { generalLimiter, authLimiter } from './middleware/rateLimit';

// ... dentro de la app:
.onBeforeHandle(generalLimiter)
```

Y en las rutas de auth, aplicar `authLimiter` en los endpoints de login/registro.

- [ ] **Step 3: Escribir test de rate limiting**

```typescript
// semestral/backend/src/__tests__/rateLimit.test.ts
import { describe, it, expect } from 'bun:test';
import { rateLimit } from '../middleware/rateLimit';

describe('rateLimit middleware', () => {
  it('returns rate limit headers on first request', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const set = { headers: {}, status: 200 };
    const request = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    await limiter({ request, set });
    expect(set.headers['X-RateLimit-Limit']).toBe('5');
    expect(set.headers['X-RateLimit-Remaining']).toBe('4');
  });

  it('throws after exceeding limit', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const set = { headers: {}, status: 200 };
    const request = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '5.6.7.8' },
    });

    await limiter({ request, set }); // 1
    await limiter({ request, set }); // 2
    try {
      await limiter({ request, set }); // 3 -> should throw
      expect(true).toBe(false); // should not reach here
    } catch (e: any) {
      expect(e.code).toBe('RATE_LIMITED');
    }
  });
});
```

- [ ] **Step 4: Correr tests**

```bash
cd semestral/backend && bun test
```

- [ ] **Step 5: Commit**

```bash
git add semestral/backend/src/middleware/rateLimit.ts semestral/backend/src/server.ts semestral/backend/src/__tests__/rateLimit.test.ts
git commit -m "feat(HU-010): rate limiting con headers X-RateLimit-* y Retry-After completos"
```

---

### Task 1.3: HU-002 — Error Boundaries en React

**Files:**
- Create: `semestral/frontend/components/ErrorBoundary.tsx`
- Create: `semestral/frontend/components/ErrorFallback.tsx`
- Create: `semestral/frontend/components/ErrorFallback.module.css`
- Modify: `semestral/frontend/app/layout.tsx` (wrap with error boundary)

- [ ] **Step 1: Crear ErrorFallback component**

```tsx
// semestral/frontend/components/ErrorFallback.tsx
'use client';

import styles from './ErrorFallback.module.css';

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.card}>
        <h2 className={styles.title}>Algo salió mal</h2>
        <p className={styles.message}>
          {error.message || 'Ocurrió un error inesperado. Por favor intentá de nuevo.'}
        </p>
        <button onClick={reset} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
```

```css
/* semestral/frontend/components/ErrorFallback.module.css */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.card {
  text-align: center;
  max-width: 480px;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.title {
  font-size: 1.5rem;
  color: #c41e3a;
  margin-bottom: 1rem;
}

.message {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.retryButton {
  padding: 0.75rem 2rem;
  background: #c41e3a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.retryButton:hover {
  background: #a01830;
}
```

- [ ] **Step 2: Crear ErrorBoundary component**

```tsx
// semestral/frontend/components/ErrorBoundary.tsx
'use client';

import React from 'react';
import ErrorFallback from './ErrorFallback';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    // Opcional: enviar a servicio de monitoreo
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback || (
          <ErrorFallback
            error={this.state.error}
            reset={this.handleReset}
          />
        )
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 3: Envolver layout principal**

En `semestral/frontend/app/layout.tsx`, agregar:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Dentro del body, envolver children:
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

- [ ] **Step 4: Commit**

```bash
git add semestral/frontend/components/ErrorBoundary.tsx semestral/frontend/components/ErrorFallback.tsx semestral/frontend/components/ErrorFallback.module.css semestral/frontend/app/layout.tsx
git commit -m "feat(HU-002): Error Boundaries en React con fallback visual y retry"
```

---

### Task 1.4: HU-015 — RBAC Granular (resource:action)

**Files:**
- Create: `semestral/backend/src/lib/permissions.ts`
- Modify: `semestral/backend/src/middleware/auth.ts`
- Create: `semestral/backend/src/__tests__/permissions.test.ts`

- [ ] **Step 1: Definir sistema de permisos**

```typescript
// semestral/backend/src/lib/permissions.ts

export type Resource = 'pasteles' | 'pedidos' | 'recetas' | 'usuarios' | 'dashboard' | 'categorias' | 'reportes' | 'mcp';
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';

export const PERMISSIONS: Record<string, { resources: Resource[]; actions: Action[] }> = {
  user: {
    resources: ['pasteles', 'pedidos', 'recetas'],
    actions: ['read', 'create'],
  },
  admin: {
    resources: ['pasteles', 'pedidos', 'recetas', 'dashboard', 'categorias', 'reportes'],
    actions: ['read', 'create', 'update', 'delete'],
  },
  superadmin: {
    resources: ['pasteles', 'pedidos', 'recetas', 'usuarios', 'dashboard', 'categorias', 'reportes', 'mcp'],
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
};

export function hasPermission(
  role: string,
  resource: Resource,
  action: Action
): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms.resources.includes(resource) && rolePerms.actions.includes(action);
}

export function requirePermission(resource: Resource, action: Action) {
  return async ({ request, set }: { request: Request; set: any }) => {
    const { verifyAdmin } = await import('../middleware/auth');
    const admin = await verifyAdmin(request.headers.get('Authorization'));
    
    if (!admin) {
      set.status = 401;
      throw new AppError(ErrorCode.UNAUTHORIZED, 'No autenticado');
    }

    if (!hasPermission(admin.role, resource, action)) {
      set.status = 403;
      throw new AppError(ErrorCode.FORBIDDEN, `Permiso denegado: ${action} ${resource}`);
    }

    return admin;
  };
}
```

- [ ] **Step 2: Aplicar en rutas admin existentes**

Actualizar `semestral/backend/src/routes/admin.ts` para usar `requirePermission`:

```typescript
import { requirePermission } from '../lib/permissions';

// Ejemplo:
.get('/pasteles', async (ctx) => {
  await requirePermission('pasteles', 'read')(ctx);
  // ... existing logic
})
```

- [ ] **Step 3: Tests de permisos**

```typescript
// semestral/backend/src/__tests__/permissions.test.ts
import { describe, it, expect } from 'bun:test';
import { hasPermission } from '../lib/permissions';

describe('RBAC permissions', () => {
  it('admin can read pasteles', () => {
    expect(hasPermission('admin', 'pasteles', 'read')).toBe(true);
  });

  it('admin cannot manage usuarios', () => {
    expect(hasPermission('admin', 'usuarios', 'manage')).toBe(false);
  });

  it('superadmin can do everything', () => {
    expect(hasPermission('superadmin', 'usuarios', 'manage')).toBe(true);
    expect(hasPermission('superadmin', 'mcp', 'manage')).toBe(true);
  });

  it('user cannot delete pasteles', () => {
    expect(hasPermission('user', 'pasteles', 'delete')).toBe(false);
  });

  it('unknown role has no permissions', () => {
    expect(hasPermission('unknown', 'pasteles', 'read')).toBe(false);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add semestral/backend/src/lib/permissions.ts semestral/backend/src/middleware/auth.ts semestral/backend/src/__tests__/permissions.test.ts
git commit -m "feat(HU-015): RBAC granular con permisos resource:action por rol"
```

---

## FASE 1 Checkpoint

Al finalizar Fase 1, verificar:
- [ ] `bun test` pasa todos los tests
- [ ] `bun run dev` levanta el backend sin errores
- [ ] `npm run dev` levanta el frontend sin errores

---

# FASE 2: Catálogo (HU-029, HU-030, HU-031)

### Task 2.1: HU-029 — Búsqueda de Pasteles por Nombre

**Files:**
- Modify: `semestral/backend/src/routes/pasteles.ts` (agregar query param `q`)
- Modify: `semestral/frontend/app/catalogo/CatalogoClient.tsx` (campo de búsqueda con debounce)

... (continúa con HU-030, HU-031)

**NOTA:** El plan continúa con las 8 fases restantes. Por brevedad del contexto, las siguientes fases se detallan en archivos separados.

---

## Resumen de Fases

| Fase | HUs | Descripción | Estado |
|------|-----|-------------|--------|
| 1 | 001, 002, 003, 010, 015 | Fundaciones (errores, rate limit, RBAC, error boundaries) | Plan escrito |
| 2 | 029, 030, 031 | Catálogo (búsqueda, filtro precio, orden) | Pendiente |
| 3 | 018, 019, 020, 027, 028, 038, 039 | UX Completa (descuentos, perfil, sesiones) | Pendiente |
| 4 | 012, 013, 022, 023, 024, 032 | Pagos y Órdenes | Pendiente |
| 5 | 021, 041 | Notificaciones Email | Pendiente |
| 6 | 005, 016, 033, 034, 035, 036, 037, 042 | Admin Panel Completo | Pendiente |
| 7 | 006, 007, 008, 040 | Accesibilidad WCAG 2.1 AA | Pendiente |
| 8 | 009, 014, 017 | Avanzado (i18n, contract testing, MCP) | Pendiente |
