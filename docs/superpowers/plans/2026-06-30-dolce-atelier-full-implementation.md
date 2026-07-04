# Dolce Atelier - Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all missing features and fixes for the Dolce Atelier bakery e-commerce platform MVP.

**Architecture:** Next.js 14 frontend with Elysia/Bun backend, MongoDB Atlas, Clerk auth, Stripe payments, Cloudinary storage, Brevo email.

**Tech Stack:** Next.js 14, React 18, TypeScript, Elysia, Bun, MongoDB/Mongoose, Clerk, Stripe, Cloudinary, Brevo, Zustand, Sonner, Zod

## Global Constraints

- Backend runtime: Bun (not Node.js)
- Frontend: Next.js 14 with App Router
- Auth: Clerk with SSO
- Payments: Stripe Checkout + Webhooks
- Database: MongoDB Atlas with Mongoose
- All new code must use TypeScript strict mode
- Follow existing code patterns and naming conventions
- Use Zod for all new schemas/validation

---

## Task 1: Fix Inconsistent Order States

**Files:**
- Modify: `backend/src/controllers/admin/pedidoController.ts`
- Modify: `backend/src/models/Pedido.ts` (verify only)

**Interfaces:**
- Consumes: `Pedido` model from `models/Pedido.ts`
- Produces: Consistent order state transitions

- [ ] **Step 1: Read current pedidoController.ts to understand state transitions**

Read file and identify all state transition logic.

- [ ] **Step 2: Fix state transitions to match model**

Replace the invalid states (CONFIRMADO, etc.) with the valid ones from the model:
```
PENDIENTE → PAGADO → PREPARANDO → LISTO → EN_CAMINO → ENTREGADO
Any state → CANCELADO
```

- [ ] **Step 3: Verify transitions are consistent**

Run: `cd backend && bun run src/server.ts` and test state changes via admin panel.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/admin/pedidoController.ts
git commit -m "fix: correct order state transitions to match model"
```

---

## Task 2: Fix clerkUserId Empty in Recipes Admin

**Files:**
- Modify: `backend/src/controllers/admin/recetaController.ts`

**Interfaces:**
- Consumes: `Receta` model, Clerk user data
- Produces: Proper clerkUserId on recipe creation

- [ ] **Step 1: Read recetaController.ts to find the bug**

Read file and locate line 21 where clerkUserId is set to empty string.

- [ ] **Step 2: Fix clerkUserId assignment**

Change from empty string to use the authenticated user's ID from the request.

- [ ] **Step 3: Test recipe creation from admin**

Create a recipe from admin panel and verify clerkUserId is populated.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/admin/recetaController.ts
git commit -m "fix: populate clerkUserId when creating recipes from admin"
```

---

## Task 3: Fix Email Duplication

**Files:**
- Modify: `frontend/app/checkout/exito/CheckoutExitoContent.tsx`
- Keep: `backend/src/routes/webhook.ts` (primary email sender)

**Interfaces:**
- Consumes: Stripe webhook confirmation
- Produces: Single email per order

- [ ] **Step 1: Read CheckoutExitoContent.tsx to find duplicate email call**

Identify the `/api/send-receipt` call.

- [ ] **Step 2: Remove the frontend email call**

Remove or comment out the fetch to `/api/send-receipt` since webhook handles it.

- [ ] **Step 3: Test checkout flow**

Complete a test checkout and verify only one email is sent (from webhook).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/checkout/exito/CheckoutExitoContent.tsx
git commit -m "fix: remove duplicate email sending from checkout success page"
```

---

## Task 4: Replace alert() with Sonner Toasts

**Files:**
- Modify: `frontend/app/admin/pasteles/page.tsx`
- Verify: `frontend/app/admin/pedidos/page.tsx`
- Verify: `frontend/app/admin/recetas/page.tsx`
- Verify: `frontend/app/admin/usuarios/page.tsx`

**Interfaces:**
- Consumes: `sonner` library (already installed)
- Produces: Toast notifications instead of browser alerts

- [ ] **Step 1: Check if sonner is properly imported in layout.tsx**

Read `frontend/app/layout.tsx` and verify `Toaster` component from sonner is included.

- [ ] **Step 2: Add Toaster if missing**

If not present, add:
```tsx
import { Toaster } from 'sonner';
// In component return:
<Toaster richColors position="top-right" />
```

- [ ] **Step 3: Replace alert() in admin/pasteles/page.tsx**

Find all `alert()` calls and replace with `toast.success()`, `toast.error()`, or `toast.info()`.

- [ ] **Step 4: Check and fix other admin pages**

Repeat for pedidos, recetas, usuarios pages.

- [ ] **Step 5: Test all admin CRUD operations**

Test create, update, delete operations and verify toasts appear.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/admin/
git commit -m "feat: replace alert() with sonner toast notifications in admin"
```

---

## Task 5: Implement Recipe Submission Form (Client)

**Files:**
- Modify: `frontend/app/recetas/page.tsx`
- Create: `frontend/components/RecetaForm.tsx`
- Modify: `backend/src/routes/recetas.ts` (verify endpoint exists)

**Interfaces:**
- Consumes: Backend recipe endpoints
- Produces: Recipe submission form with file upload

- [ ] **Step 1: Verify backend recipe endpoints exist**

Read `backend/src/routes/recetas.ts` and confirm POST endpoint for creating recipes.

- [ ] **Step 2: Create RecetaForm component**

Create `frontend/components/RecetaForm.tsx` with:
- Text inputs for name, email, phone
- Textarea for description
- File upload for reference images
- Select for category (chocolate, vainilla, frutas, especial)
- Submit button with loading state

- [ ] **Step 3: Implement file upload to Cloudinary**

Use existing upload endpoint or create client-side upload logic.

- [ ] **Step 4: Update recetas/page.tsx**

Replace placeholder with the actual form component.

- [ ] **Step 5: Add form validation with Zod**

Create schema for recipe form data.

- [ ] **Step 6: Test recipe submission**

Submit a test recipe and verify it appears in admin panel.

- [ ] **Step 7: Commit**

```bash
git add frontend/app/recetas/page.tsx frontend/components/RecetaForm.tsx
git commit -m "feat: implement recipe submission form for clients"
```

---

## Task 6: Implement Cart Merge on Login

**Files:**
- Modify: `frontend/store/carrito.ts`
- Modify: `frontend/middleware.ts` (or create auth callback)

**Interfaces:**
- Consumes: Clerk auth state, localStorage cart
- Produces: Merged cart on authentication

- [ ] **Step 1: Design cart merge strategy**

Decide: merge anonymous cart with user's saved cart (if any) on login.

- [ ] **Step 2: Create API endpoint for cart persistence (optional)**

If server-side cart storage is needed, create endpoint in backend.

- [ ] **Step 3: Implement merge logic in carrito.ts**

Add function to merge carts when user signs in, handling duplicates by summing quantities.

- [ ] **Step 4: Hook into Clerk auth state**

Use `useAuth` or `useUser` hook to detect login and trigger merge.

- [ ] **Step 5: Test cart persistence**

Add items as anonymous, login, verify items persist, add more, logout, verify.

- [ ] **Step 6: Commit**

```bash
git add frontend/store/carrito.ts
git commit -m "feat: implement cart merge on user authentication"
```

---

## Task 7: Implement Seed Script Automation

**Files:**
- Modify: `backend/src/seed.ts`
- Create: `backend/scripts/seed-auto.ts`

**Interfaces:**
- Consumes: Pastel model, Cloudinary images
- Produces: Automated seeding on first run

- [ ] **Step 1: Review existing seed.ts**

Read file and understand current implementation.

- [ ] **Step 2: Create auto-seed script**

Create script that runs on server startup if DB is empty.

- [ ] **Step 3: Add check for existing data**

Before seeding, check if pasteles collection is empty.

- [ ] **Step 4: Integrate with server startup**

Call seed function from `server.ts` on startup.

- [ ] **Step 5: Test auto-seeding**

Start fresh DB, verify pasteles are created automatically.

- [ ] **Step 6: Commit**

```bash
git add backend/src/seed.ts backend/src/server.ts
git commit -m "feat: auto-seed database on first startup"
```

---

## Task 8: Convert Pages to SSR for SEO

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/catalogo/page.tsx`
- Modify: `frontend/app/sobre-nosotros/page.tsx`
- Modify: `frontend/app/contactenos/page.tsx`

**Interfaces:**
- Consumes: Server-side data fetching
- Produces: Server-rendered pages for SEO

- [ ] **Step 1: Convert landing page to Server Component**

Remove `'use client'` from `page.tsx`, move client-side logic to separate component.

- [ ] **Step 2: Convert catalogo page to Server Component**

Make catalog listing server-rendered, keep filter/pagination as client components.

- [ ] **Step 3: Convert static pages to Server Components**

Update sobre-nosotros and contactenos.

- [ ] **Step 4: Add proper metadata exports**

Add `metadata` export to each page for SEO.

- [ ] **Step 5: Test all pages render correctly**

Verify no hydration errors, pages load properly.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: convert main pages to SSR for SEO"
```

---

## Task 9: Add SEO Metadata

**Files:**
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/lib/seo.ts`

**Interfaces:**
- Consumes: Page-specific content
- Produces: Complete SEO metadata

- [ ] **Step 1: Create SEO utility**

Create `frontend/lib/seo.ts` with metadata generation functions.

- [ ] **Step 2: Update layout.tsx with base metadata**

Add title template, description, openGraph defaults.

- [ ] **Step 3: Add metadata to each page**

Add page-specific title, description, ogImage to each page's metadata export.

- [ ] **Step 4: Verify with metadata viewer**

Use browser extension or online tool to verify metadata.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/layout.tsx frontend/lib/seo.ts frontend/app/*/
git commit -m "feat: add comprehensive SEO metadata to all pages"
```

---

## Task 10: Add Loading States

**Files:**
- Create: `frontend/components/LoadingSpinner.tsx`
- Create: `frontend/components/SkeletonCard.tsx`
- Modify: Various pages to add loading states

**Interfaces:**
- Consumes: React suspense, loading states
- Produces: Consistent loading feedback

- [ ] **Step 1: Create LoadingSpinner component**

Create reusable spinner component.

- [ ] **Step 2: Create SkeletonCard component**

Create skeleton loader for cards.

- [ ] **Step 3: Add loading.tsx files to routes**

Create `loading.tsx` in catalogo, carrito, pedidos, admin routes.

- [ ] **Step 4: Add loading states to data fetching**

Use React Suspense where applicable.

- [ ] **Step 5: Test loading states**

Verify spinners appear during data fetching.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/ frontend/app/*/loading.tsx
git commit -m "feat: add consistent loading states across application"
```

---

## Task 11: Fix Hardcoded Rewrites

**Files:**
- Modify: `frontend/next.config.js`
- Modify: `frontend/.env.local`

**Interfaces:**
- Consumes: Environment variables
- Produces: Configurable API URL

- [ ] **Step 1: Read current next.config.js**

Identify all hardcoded localhost:3001 rewrites.

- [ ] **Step 2: Update rewrites to use environment variable**

Replace hardcoded URL with `process.env.NEXT_PUBLIC_API_URL`.

- [ ] **Step 3: Verify .env.local has correct API URL**

Ensure `NEXT_PUBLIC_API_URL` is set properly.

- [ ] **Step 4: Test all API calls**

Verify catalog, cart, checkout, orders all work.

- [ ] **Step 5: Commit**

```bash
git add frontend/next.config.js
git commit -m "fix: use environment variable for API URL in rewrites"
```

---

## Task 12: Configure Deployment (Vercel + Railway)

**Files:**
- Create: `vercel.json`
- Create: `frontend/vercel.json` (if needed)
- Create: `backend/railway.json` (or `Procfile`)
- Modify: `frontend/.env.local` (production values)
- Modify: `backend/.env` (production values)

**Interfaces:**
- Consumes: Project configuration
- Produces: Deployment-ready configuration

- [ ] **Step 1: Create Vercel configuration**

Create `vercel.json` with:
- Framework preset: Next.js
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/.next`
- Environment variables mapping

- [ ] **Step 2: Create Railway configuration**

Create `Procfile` or `railway.json` for backend:
- Start command: `cd backend && bun run src/server.ts`
- Environment: production

- [ ] **Step 3: Update environment variables for production**

Create `.env.production` files with production URLs (not committed).

- [ ] **Step 4: Document deployment steps**

Add deployment instructions to README.md.

- [ ] **Step 5: Commit**

```bash
git add vercel.json backend/Procfile
git commit -m "feat: add deployment configuration for Vercel and Railway"
```

---

## Task 13: Write Unit Tests

**Files:**
- Create: `frontend/__tests__/` directory structure
- Create: `backend/__tests__/` directory structure
- Create: Test files for core functionality

**Interfaces:**
- Consumes: Existing code
- Produces: Test coverage for critical paths

- [ ] **Step 1: Set up testing framework**

Frontend: Install Jest + React Testing Library
Backend: Install Vitest or Bun test runner

- [ ] **Step 2: Write tests for cart functionality**

Test add, remove, update, merge operations.

- [ ] **Step 3: Write tests for order state transitions**

Test valid and invalid state changes.

- [ ] **Step 4: Write tests for recipe form validation**

Test Zod schema validation.

- [ ] **Step 5: Write tests for API endpoints**

Test critical API routes with mock data.

- [ ] **Step 6: Achieve minimum 60% coverage**

Run coverage report and add tests as needed.

- [ ] **Step 7: Commit**

```bash
git add frontend/__tests__/ backend/__tests__/
git commit -m "test: add unit tests for core functionality"
```

---

## Task 14: Final Integration Testing

**Files:**
- Verify all tasks completed
- Fix any integration issues

**Interfaces:**
- Consumes: All implemented features
- Produces: Working MVP

- [ ] **Step 1: Start both servers**

```bash
cd backend && bun run src/server.ts
cd frontend && npm run dev
```

- [ ] **Step 2: Test complete user flow**

1. Browse catalog as anonymous
2. Add items to cart
3. Sign up / Sign in
4. Verify cart persists
5. Complete checkout
6. Verify email received
7. View order in history
8. Admin: manage orders
9. Admin: manage recipes
10. Submit recipe as client

- [ ] **Step 3: Fix any issues found**

Address any bugs discovered during testing.

- [ ] **Step 4: Run all tests**

```bash
cd frontend && npm test
cd backend && bun test
```

- [ ] **Step 5: Verify all pages load without errors**

Check browser console for any errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete MVP implementation with all features and tests"
```

---

## Auto-Evaluation Checklist

After completing all tasks, verify:

- [ ] All 14 tasks completed
- [ ] All tests passing
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Cart merge works on login
- [ ] Recipe submission works
- [ ] Email sending works (no duplicates)
- [ ] Toast notifications work (no alert())
- [ ] Admin CRUD operations work
- [ ] SEO metadata present
- [ ] Loading states visible
- [ ] Deployment configured
- [ ] Git commits clean and descriptive

---

## Execution Notes

- **Order:** Tasks can be executed sequentially as numbered
- **Dependencies:** Tasks 1-4 are independent, Task 5 depends on backend verification, Task 6 is independent, Tasks 7-14 are mostly independent
- **Time estimate:** 2-4 hours total
- **Risk areas:** Task 6 (cart merge) may need design decisions, Task 13 (testing) may require significant effort
