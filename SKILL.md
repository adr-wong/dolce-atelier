# SKILL.md — Dolce Atelier

# Versión 2.0 — Totalmente alineado con PRD

---

## 🎯 Objetivo del Sistema

Construir una plataforma ecommerce B2C de pasteles artesanales con:

* Catálogo SSR optimizado para SEO
* Carrito persistente
* Pagos con Stripe (webhooks)
* Módulo de recetas personalizadas
* Panel administrativo completo

---

## ⚠️ REGLAS CRÍTICAS (NO NEGOCIABLES)

* NO usar `any` en TypeScript
* TODA request debe validarse con Zod
* NUNCA lógica de negocio en el frontend
* Stripe SOLO se usa desde el backend
* Webhooks SIN auth, SOLO verificación HMAC
* NO exponer variables sensibles en frontend
* NO mezclar responsabilidades (frontend ≠ backend)
* SIEMPRE código modular
* NO generar código sin definir primero el endpoint

---

## 🧱 STACK TECNOLÓGICO (FIJO)

| Capa          | Tecnología              |
| ------------- | ----------------------- |
| Frontend      | Next.js 14 (App Router) |
| Backend       | Node.js sobre Bun       |
| Base de datos | MongoDB + Mongoose      |
| Auth          | Clerk SDK               |
| Pagos         | Stripe Checkout         |
| Storage       | Cloudinary              |
| Email         | SendGrid                |
| Estado FE     | Zustand                 |
| Validación    | Zod                     |

> ❌ PROHIBIDO: Prisma, PostgreSQL, Firebase, Supabase, GraphQL

---

## 🧠 ARQUITECTURA OBLIGATORIA

### Frontend

* Server Components por defecto
* Client Components solo para interacción
* Middleware para protección de rutas
* SSR obligatorio en catálogo

---

### Backend

* API REST pura
* Validación con Zod en TODOS los endpoints
* Separación en capas:

  * routes
  * services
  * models
  * middleware

---

## 📁 ESTRUCTURA OBLIGATORIA

```
/frontend
/backend
```

NO inventar nuevas estructuras.

---

## 🔐 AUTENTICACIÓN (CLERK)

* Usar SIEMPRE SDK (NO iframe)
* Middleware protege rutas antes del render
* Backend verifica token manualmente

---

## 💳 PAGOS (STRIPE)

* Crear sesión SOLO en backend
* Usar Stripe Checkout (no custom forms)
* Webhook obligatorio:

  * `checkout.session.completed`
* Actualizar estado a PAGADO SOLO desde webhook

---

## 🛒 LÓGICA DE NEGOCIO

### Pedido

```
PENDIENTE → PAGADO → PREPARANDO → LISTO → EN_CAMINO → ENTREGADO
```

* CANCELADO si no paga en 30 min
* NO reservar stock antes del pago

---

### Carrito

* Persistente en localStorage
* Se fusiona al hacer login
* Guarda snapshot de precio

---

### Recetas

```
PENDIENTE → REVISANDO → COTIZADA → ACEPTADA / RECHAZADA
```

---

## 🧩 MODELO DE DATOS (MONGODB)

### Pastel

* nombre
* precio
* categoria
* imagen
* disponible

---

### Pedido

* clerkUserId
* estado
* total
* items[]

---

### Receta

* clerkUserId
* archivoUrl
* estado
* cotizacion

---

## 🚀 FLUJO DE DESARROLLO (OBLIGATORIO)

### FASE 1 — Setup

* Proyecto base
* Conexión MongoDB
* Configuración env

---

### FASE 2 — Auth

* Clerk integrado
* Middleware funcionando

---

### FASE 3 — Catálogo

* SSR activo
* Modelo Pastel
* Listado + detalle

---

### FASE 4 — Carrito + Pagos

* Zustand
* Stripe Checkout
* Webhook funcional

---

### FASE 5 — Pedidos + Recetas

* Historial
* Subida de recetas
* Cotización

---

### FASE 6 — Admin

* CRUD catálogo
* Gestión pedidos
* Dashboard

---

## 🧪 REGLAS DE IMPLEMENTACIÓN

Antes de escribir código SIEMPRE:

1. Definir endpoint
2. Definir input/output
3. Definir validación Zod
4. Luego implementar

---

## 🛑 RESTRICCIONES DE IA

* NO asumir cosas fuera del PRD
* NO cambiar el stack
* NO simplificar lógica de negocio
* NO omitir validaciones
* NO generar código incompleto

---

## ✅ CRITERIOS DE CALIDAD

* Código limpio y modular
* Sin duplicación
* Tipado estricto
* Manejo de errores correcto
* Seguridad aplicada

---

## 🎯 OBJETIVO FINAL

Sistema funcional con:

* Flujo completo de compra
* Pagos reales (modo test)
* Panel admin usable
* Arquitectura escalable
