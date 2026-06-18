# Spec: Refactor Responsive + Limpieza de Código — Dolce Atelier

**Fecha:** 2026-06-18  
**Estado:** Aprobado  
**Enfoque seleccionado:** A (CSS Modules + Media Queries nativas)

---

## Objetivo

Migrar los estilos inline masivos del frontend (60-80% del código de cada página) a CSS Modules con media queries nativas, resolver los problemas de responsive existentes, y ejecutar una limpieza de código complementaria (componentes muertos, tipos duplicados, logs de debug, auth inconsistente).

---

## 1. CSS Modules — Migración de estilos inline

### Breakpoints unificados

Se definen en `globals.css` como variables CSS:

```css
:root {
  --bp-mobile: 480px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}
```

Todos los CSS Modules usarán estos valores en sus `@media` queries.

### Archivos a crear (20 módulos)

| # | Componente/Página | Archivo CSS Module |
|---|-------------------|-------------------|
| 1 | `app/page.tsx` | `app/home.module.css` |
| 2 | `app/catalogo/page.tsx` | `app/catalogo/catalogo.module.css` |
| 3 | `app/catalogo/[id]/page.tsx` | `app/catalogo/[id]/detalle.module.css` |
| 4 | `app/carrito/page.tsx` | `app/carrito/carrito.module.css` |
| 5 | `app/checkout/page.tsx` | `app/checkout/checkout.module.css` |
| 6 | `app/checkout/exito/page.tsx` | `app/checkout/exito/exito.module.css` |
| 7 | `app/checkout/error/page.tsx` | `app/checkout/error/error.module.css` |
| 8 | `app/pedidos/page.tsx` | `app/pedidos/pedidos.module.css` |
| 9 | `app/contactenos/page.tsx` | `app/contactenos/contactenos.module.css` |
| 10 | `app/sobre-nosotros/page.tsx` | `app/sobre-nosotros/sobre-nosotros.module.css` |
| 11 | `app/recetas/page.tsx` | `app/recetas/recetas.module.css` |
| 12 | `app/not-found.tsx` | `app/not-found.module.css` |
| 13 | `app/admin/layout.tsx` | `app/admin/admin-layout.module.css` |
| 14 | `app/admin/page.tsx` | `app/admin/admin-dashboard.module.css` |
| 15 | `app/admin/pasteles/page.tsx` | `app/admin/pasteles/pasteles.module.css` |
| 16 | `app/admin/pedidos/page.tsx` | `app/admin/pedidos/pedidos.module.css` |
| 17 | `app/admin/recetas/page.tsx` | `app/admin/recetas/recetas.module.css` |
| 18 | `app/admin/usuarios/page.tsx` | `app/admin/usuarios/usuarios.module.css` |
| 19 | `components/Header.tsx` | `components/header.module.css` |
| 20 | `components/BotonAgregar.tsx` | `components/boton-agregar.module.css` |

### Reglas de migración

- Cada regla CSS se nombra con camelCase para consistencia con la convención de CSS Modules
- Las media queries van dentro de cada regla, no al final del archivo (colocate pattern)
- Las variables CSS (`var(--primary)`, etc.) se reutilizan en los módulos
- Animaciones (`fadeIn`, `slideIn`) permanecen en `globals.css` y se referencian desde módulos

---

## 2. Hook useMediaQuery — Alcance reducido

El hook se conserva pero se usa **solo para lógica JS condicional**:

- `components/Header.tsx` → para toggle del menú hamburguesa
- `app/admin/layout.tsx` → para mostrar/ocultar sidebar
- Cualquier página que necesite `window.matchMedia` para decidir qué renderizar (no cómo estilizarlo)

Se elimina de todas las páginas donde solo se usaba para generar objetos `style` dinámicos (eso lo reemplazan las media queries CSS).

Se actualiza el hook para usar los breakpoints unificados (480/768/1024).

---

## 3. Limpieza de código

### 3.1 Componentes muertos

- `AdminSidebar.tsx` → Eliminar (admin/layout.tsx tiene su propio sidebar inline)
- `DataTable.tsx` → Eliminar (ninguna página lo importa)
- `TarjetaPastel.tsx` → Se evaluará si se reutiliza en catálogo o se elimina

### 3.2 Tipos duplicados

- Unificar `Pastel` en una sola definición en `lib/types.ts`
- Todos los archivos que definían su propio `Pastel` deben importar de `lib/types.ts`

### 3.3 Backend fixes

- `backend/src/routes/pedidos.ts` → Eliminar logs de debug (`console.log` verbosos)
- `backend/src/seed.ts` → Reemplazar path hardcodeado por path relativo (`path.join(__dirname, ...)`)
- Admin pedidos filtro → Reemplazar `CONFIRMADO` por `PAGADO` (estado real del modelo)

### 3.4 Auth unificada

- Eliminar `components/ProtectedRoute.tsx` (redundante con `middleware.ts`)
- Las páginas admin que hacían `getToken()` manual se apoyarán solo en el middleware

### 3.5 SEO metadata

- Añadir export `metadata` en: catálogo, carrito, checkout, pedidos, contacto, sobre-nosotros, admin

---

## 4. No se modifica

- Lógica de negocio (carrito Zustand, checkout Stripe, admin CRUD)
- Backend core (modelos Mongoose, rutas, servicios, middleware de auth)
- Variables CSS existentes en `globals.css`
- Autenticación Clerk (middleware, sign-in/sign-up pages)

---

## 5. Verificación

- `npm run build` debe compilar sin errores
- `npm run lint` debe pasar sin nuevos warnings
- Cada página debe verse idéntica a como se veía antes de la migración
- No debe haber flickering en el SSR al cargar páginas
- Los breakpoints 480/768/1024 deben comportarse consistentemente
