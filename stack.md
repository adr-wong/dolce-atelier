# Dolce Atelier - Stack

## Architecture

Monorepo with `frontend/`, `backend/`, and `mcp/` packages.

| Layer | Tech |
|-------|------|
| Auth | **Clerk** — managed auth, JWT verification on backend. Roles: `user`, `admin`, `superadmin` in Clerk `publicMetadata` |
| Database | **MongoDB** (Atlas) via **Mongoose** |
| Backend | **Elysia** (port 3001), REST API |
| Frontend | **Next.js 16** (port 3000), proxies `/api/*` to backend via rewrites |
| Payments | **Stripe** Checkout Sessions + webhooks |
| Storage | **Cloudinary** for images |
| Email | **Brevo** + **Resend** |

## Key Models

- **Pastel** — Cake product catalog (nombre, precio, categoria, imagen, disponible)
- **Pedido** — Orders (clerkUserId, email, estado, total, items[], metodoEntrega, stripeSessionId, calificacion)
- **Receta** — Custom recipe requests (clerkUserId, archivoUrl, nota, personas, estado, cotizacion)
- **Categoria** — Product categories (nombre, slug, imagen, activa)
- **CodigoDescuento** — Discount codes
- **AuditLog** — Audit trail (auto-expires 90 days)
- **WebhookEvent** — Stripe webhook idempotency (auto-expires 72h)

No dedicated User model — Clerk manages users. Backend references users via `clerkUserId`.

## Order State Machine

`PENDIENTE` → `PAGADO` → `PREPARANDO` → `LISTO` → `EN_CAMINO` → `ENTREGADO`
(or `CANCELADO` from `PENDIENTE`)

## Recipe State Machine

`PENDIENTE` → `REVISANDO` → `COTIZADA` → `ACEPTADA` / `RECHAZADA`

## API Routes

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/api/pasteles` | GET public, rest auth | Cake catalog CRUD |
| `/api/pedidos` | Auth | Order CRUD, cancel, rate |
| `/api/recetas` | Auth | Custom recipe requests |
| `/api/admin` | Admin/superadmin | Dashboard, manage entities |
| `/api/admin/usuarios` | Admin/superadmin | User management, roles, impersonation |
| `/api/webhook/stripe` | Stripe signature | Payment processing |
| `/api/upload` | Auth | File uploads (Cloudinary) |
| `/api/descuentos` | — | Discount codes |
| `/api/reembolsos` | — | Refunds |
| `/api/carrito` | Auth | Cross-device cart (stored in Clerk metadata) |

## Frontend ↔ Backend

- Client-side: `fetch('/api/...')` → Next.js rewrite → backend at `BACKEND_URL` (default `http://localhost:3001`)
- Server-side: `getApiUrl()` helper returns `NEXT_PUBLIC_API_URL`
- State: Zustand + localStorage for cart, `CartMergeProvider` syncs on login

## Deployment

| Component | Platform |
|-----------|----------|
| Backend | Railway (Nixpacks, `bun run src/server.ts`) |
| Frontend | Vercel (`@vercel/next` builder) |
