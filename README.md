[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=adr-wong_dolce-atelier&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=adr-wong_dolce-atelier)
# Dolce Atelier - Sistema de Gestión de Pastelería

## 📋 Descripción General

Dolce Atelier es una aplicación web full-stack para la gestión de una pastelería. Permite a los clientes explorar un catálogo de pasteles, agregar productos al carrito, realizar pedidos con pago vía Stripe, y a los administradores gestionar el inventario, pedidos y contenido del sitio.

El proyecto está estructurado en dos aplicaciones independientes: un **frontend** (Next.js) y un **backend** (Elysia/Bun), siguiendo una arquitectura de microservicios con comunicación REST.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌──────────▼──────────┐
                    │     FRONTEND        │
                    │   (Next.js 16)      │
                    │   Puerto: 3000      │
                    └──────────┬──────────┘
                              │ HTTP/REST
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        BACKEND                                  │
│                     (Elysia + Bun)                              │
│                    Puerto: 3001                                 │
│   ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│   │   Routes    │  Services   │   Models    │   Middleware    │ │
│   │  /api/*     │  (Stripe,   │  (Mongoose) │  (Clerk Auth)   │ │
│   │             │  Cloudinary,│             │                 │ │
│   │             │  Resend)    │             │                 │ │
│   └─────────────┴─────────────┴─────────────┴─────────────────┘ │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌─────▼──────┐ ┌──────▼──────┐
     │    MongoDB      │ │  Stripe    │ │ Cloudinary  │
     │   (Atlas Cloud) │ │  (Pagos)   │ │  (Imágenes) │
     └─────────────────┘ └────────────┘ └─────────────┘
                                │
                         ┌──────▼──────┐
                         │   Resend    │
                         │  (Email)    │
                         └─────────────┘
```

---

## 🛠️ Stack Tecnológico Completo

### Frontend

| Tecnología      | Versión     | Propósito |
|-----------------|-------------|-----------|
| **Next.js**     | 16.2.4      | Framework de React con Server Components, App Router, y rendering híbrido (SSR/SSG) |
| **React**       | 18.3.1      | Librería UI para la construcción de interfaces |
| **TypeScript**  | 6.0.3       | Lenguaje tipado para mayor seguridad y mantenibilidad |
| **Zustand**     | 5.0.12      | Estado global para el carrito de compras (gestión de estado ligera) |
| **Clerk**       | 7.3.0       | Autenticación y gestión de usuarios (OAuth, sessions, user metadata) |
| **Sonner**      | 2.0.7       | Librería de notificaciones toast (feedback visual al usuario) |
| **Zod**         | 4.4.1       | Validación de esquemas y tipos (seguridad en formularios) |
| **Resend**      | 6.1.3       | Servicio de envío de emails transaccionales |
| **next/image**  | (integrado) | Optimización y lazy-loading de imágenes |
| **next/link**   | (integrado) | Navegación entre páginas con pre-fetching |

#### Patrones de Diseño Frontend
- **Client Components** (`'use client'`) para interactividad (carrito, formularios)
- **Server Components** para contenido estático y SEO
- **Zustand Middleware** `persist` para guardar estado del carrito en localStorage
- **Custom Hooks** (`useMediaQuery`) para responsive design
- **URL-based state** (searchParams) para filtros y paginación

### Backend

| Tecnología            | Versión          | Propósito |
|-----------------------|------------------|-----------|
| **Elysia**            | 1.4.28           | Framework web minimalista de alto rendimiento (similar a Express pero más rápido) |
| **Bun**               | (runtime)        | Runtime de JavaScript/TypeScript, bundler y package manager todo-en-uno |
| **Mongoose**          | 8.0.0            | ODM para modelado y interacción con MongoDB |
| **MongoDB**           | (Atlas Cloud)    | Base de datos NoSQL orientada a documentos (cloud) |
| **Stripe**            | 17.7.0           | API de pagos (checkout, webhooks, sesiones) |
| **Clerk**             | 1.19.1 (backend) | Verificación de tokens JWT y gestión de usuarios desde el servidor |
| **Cloudinary**        | 2.5.1            | CDN para subida y almacenamiento de imágenes |
| **Zod**               | 3.24.1           | Validación de datos de entrada en el backend |
| **Resend**            | 6.1.3            | Servicio de email transaccional |
| **@elysiajs/cors**    | 1.3.2            | Middleware de CORS para permitir comunicación con el frontend |
| **@sinclair/typebox** | 0.34.49          | Sistema de tipos para validación de запрос |

#### Patrones de Diseño Backend
- **Elysia Server** con arquitectura modular por rutas (prefix `/api/...`)
- **Service Layer** para lógica de negocio separada de las rutas
- **Middleware de autenticación** con verificación de tokens Clerk
- **Webhook pattern** para recibir eventos de Stripe asincrónicamente
- **Schema validation** con Zod y TypeBox para todos los inputs

---

## 📁 Estructura del Proyecto

```
parcial_1/
├── frontend/                    # Aplicación Next.js (cliente)
│   ├── app/                    # App Router de Next.js
│   │   ├── admin/              # Panel de administración
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── pasteles/       # Gestión de pasteles
│   │   │   ├── pedidos/       # Gestión de pedidos
│   │   │   ├── recetas/        # Gestión de recetas
│   │   │   └── usuarios/       # Gestión de usuarios
│   │   ├── carrito/            # Vista del carrito
│   │   ├── catalogo/           # Catálogo de productos
│   │   ├── checkout/           # Proceso de pago
│   │   ├── contactenos/        # Página de contacto
│   │   ├── recetas/            # Página de recetas
│   │   ├── pedidos/            # Mis pedidos (cliente)
│   │   ├── sobre-nosotros/     # Página informativa
│   │   ├── sign-in/            # Auth Clerk
│   │   ├── sign-up/            # Auth Clerk
│   │   ├── layout.tsx          # Layout raíz
│   │   └── page.tsx            # Página principal (home)
│   ├── components/             # Componentes reutilizables
│   │   ├── Header.tsx          # Navegación principal
│   │   ├── TarjetaPastel.tsx   # Card de producto
│   │   ├── BotonAgregar.tsx    # Botón añadir al carrito
│   │   └── DataTable.tsx       # Tablas para admin
│   ├── hooks/                  # Custom React hooks
│   │   └── useMediaQuery.ts    # Hook para responsive
│   ├── store/                  # Estado global (Zustand)
│   │   └── carrito.ts          # Store del carrito
│   ├── lib/                    # Utilidades y tipos
│   │   └── types.ts            # Tipos TypeScript
│   ├── middleware.ts           # Middleware Next.js (auth)
│   └── package.json
│
├── backend/                    # API Elysia (servidor)
│   └── src/
│       ├── server.ts          # Entry point y configuración
│       ├── routes/            # Definición de endpoints
│       │   ├── auth.ts        # Rutas de autenticación
│       │   ├── pasteles.ts    # CRUD de pasteles
│       │   ├── pedidos.ts     # CRUD de pedidos
│       │   ├── recetas.ts     # CRUD de recetas
│       │   ├── upload.ts      # Subida de archivos
│       │   ├── usuarios.ts    # Gestión de usuarios
│       │   ├── webhook.ts     # Webhooks de Stripe
│       │   └── admin.ts      # Endpoints administrativos
│       ├── services/          # Lógica de negocio
│       │   ├── pastel.ts      # Servicio de pasteles
│       │   ├── pedido.ts      # Servicio de pedidos
│       │   ├── receta.ts      # Servicio de recetas
│       │   ├── stripe.ts      # Integración pagos
│       │   ├── cloudinary.ts  # Gestión de imágenes
│       │   └── resend.ts      # Servicio de email
│       ├── models/             # Modelos Mongoose
│       │   ├── Pastel.ts      # Schema Pastel
│       │   ├── Pedido.ts      # Schema Pedido
│       │   └── Receta.ts      # Schema Receta
│       ├── middleware/         # Middleware del servidor
│       │   ├── auth.ts        # Verificación JWT Clerk
│       │   └── elysiaAuthAdmin.ts
│       ├── lib/                # Utilidades
│       │   ├── db.ts          # Conexión MongoDB
│       │   └── clerk.ts       # Cliente Clerk server-side
│       ├── schemas/           # Schemas Zod
│       ├── controllers/       # Controladores admin
│       └── seed.ts            # Script de seed (datos iniciales)
└── package.json               # Workspace raíz (opcional)
```

---

## 🔌 APIs y Endpoints

### Backend API (`http://localhost:3001`)

#### Pasteles
| Método | Endpoint            | Descripción                                        | Auth |
|--------|---------------------|----------------------------------------------------|------|
| GET    | `/api/pasteles`     | Listar pasteles (filtro por categoría, paginación) | No |
| GET    | `/api/pasteles/:id` | Obtener pastel por ID                              | No |
| POST   | `/api/pasteles`     | Crear pastel                                       | Sí (Admin) |
| PUT    | `/api/pasteles/:id` | Actualizar pastel                                  | Sí (Admin) |
| DELETE | `/api/pasteles/:id` | Eliminar pastel                                    | Sí (Admin) |

#### Pedidos
| Método | Endpoint         | Descripción                | Auth |
|--------|------------------|----------------------------|------|
| GET  | `/api/pedidos`     | Listar pedidos del usuario | Sí |
| GET  | `/api/pedidos/:id` | Detalle de pedido          | Sí |
| POST | `/api/pedidos`     | Crear nuevo pedido         | Sí |
| PUT  | `/api/pedidos/:id` | Actualizar estado          | Sí (Admin) |

#### Checkout y Pagos
| Método | Endpoint                | Descripción                 | Auth |
|--------|-------------------------|-----------------------------|------|
| POST   | `/api/pedidos/checkout` | Crear sesión de pago Stripe | Sí |
| POST   | `/api/webhook/stripe`   | Webhook para confirmar pagos| Stripe Signature |

#### Uploads
| Método | Endpoint             | Descripción             | Auth |
|--------|----------------------|-------------------------|------|
| POST   | `/api/upload`        | Subir imagen de pastel  | Sí (Admin) |
| POST   | `/api/upload/receta` | Subir archivo de receta | Sí (Admin) |

---

## 🔐 Autenticación y Autorización

### Clerk (Frontend + Backend)

El sistema utiliza **Clerk** como proveedor de autenticación:

**Frontend:**
- `<UserButton />` componente para dropdown de usuario
- `useUser()` hook para obtener datos del usuario
- Middleware Next.js para proteger rutas

**Backend:**
- Token JWT verificado con `@clerk/backend`
- Roles almacenados en `publicMetadata` del usuario
- Roles: `admin`, `superadmin`, `user`

**Flujo de autenticación:**
```
1. Usuario hace login en Clerk (OAuth o email/password)
2. Clerk guarda sesión y devuelve token (JWT)
3. Token se envía en header `Authorization: Bearer <token>`
4. Backend verifica token con clerkVerifyToken()
5. Si es admin, permite acceso a rutas protegidas
```

**Middleware de Next.js (protección de rutas):**
```typescript
// Rutas protegidas: /carrito, /pedidos, /recetas, /admin
clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect(); // Redirige a sign-in si no está autenticado
  }
})
```

---

## 💳 Procesamiento de Pagos (Stripe)

### Flujo de Checkout

```
1. Usuario llena carrito → Click "Proceder al Pago"
2. Frontend llama POST /api/pedidos/checkout
3. Backend crea Stripe Checkout Session
4. Frontend redirige a Stripe Checkout (página de Stripe)
5. Usuario ingresa datos de tarjeta
6. Stripe procesa pago
7. Stripe envía webhook a /api/webhook/stripe
8. Webhook confirma pago y envía email de factura
9. Frontend muestra página de éxito o error
```

### Webhook Stripe
- **Endpoint:** `POST /api/webhook/stripe`
- **Eventos:** `checkout.session.completed`
- **Validación:** Firma HMAC con `STRIPE_WEBHOOK_SECRET`
- **Acciones:** Confirmar pedido + enviar factura por email

---

## ☁️ Almacenamiento y CDN (Cloudinary)

### Subida de Imágenes
```typescript
// Servicio de Cloudinary
subirImagen(buffer, folder: 'dolce-atelier/catalogo')
// Retorna URL segura: https://res.cloudinary.com/daffoedqf/...
```

### Configuración en Next.js
```javascript
// next.config.js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com' },
    { protocol: 'https', hostname: 'images.unsplash.com' }
  ]
}
```

---

## 📧 Servicio de Email (Resend)

### Emails enviados:
1. **Factura de pedido** - Confirmación después de pago exitoso
2. **Formulario de contacto** - Cuando cliente envía mensaje

### Configuración:
- **Dominio verificado:** `resend.dev` (testing) o dominio propio
- **From:** `Dolce Atelier <noreply@dolceatelier.com>`
- **API Key:** `re_LnXEFvqH_...`

---

## 🗄️ Base de Datos (MongoDB Atlas)

### Modelos (Mongoose)

**Pastel:**
```typescript
{
  nombre: String,       // ej: "Chocolate Clásico"
  precio: Number,       // ej: 450 (USD)
  categoria: String,   // 'chocolate' | 'vainilla' | 'frutas' | 'especial'
  imagen: String,       // URL de Cloudinary
  disponible: Boolean,  // true = se muestra en catálogo
  descripcion: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Pedido:**
```typescript
{
  usuarioId: String,
  items: [{ pastelId, nombre, precioSnapshot, cantidad }],
  total: Number,
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'PAGADO' | 'ENTREGADO' | 'CANCELADO',
  metodoEntrega: 'retiro' | 'envio',
  direccionEnvio: String,
  sessionId: String,    // Stripe checkout session ID
  createdAt: Date
}
```

**Receta:**
```typescript
{
  titulo: String,
  descripcion: String,
  ingredientes: [String],
  instrucciones: String,
  imagenUrl: String,
  pdfUrl: String,
  createdAt: Date
}
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos
- Node.js 18+ (o Bun)
- MongoDB Atlas (cloud) o local
- Cuentas de: Clerk, Stripe, Cloudinary, Resend

### Backend

```bash
cd backend

# Instalar dependencias (si no están)
bun install

# Variables de entorno necesarias (.env):
# - MONGODB_URI
# - CLERK_SECRET_KEY
# - STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
# - CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET
# - RESEND_API_KEY
# - FRONTEND_URL=http://localhost:3000
# - SKIP_AUTH=true (solo en desarrollo)

# Ejecutar servidor
bun src/server.ts
# Servidor: http://localhost:3001
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Variables de entorno necesarias (.env.local):
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_API_URL=http://localhost:3001
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Ejecutar desarrollo
npm run dev
# Frontend: http://localhost:3000
```

### Stripe CLI (para webhooks en desarrollo)
```bash
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

---

## 📊 Métodos y Protocolos Utilizados

### Protocolos de Comunicación
| Protocolo    |   Uso |
|--------------|-------|
| **HTTP/1.1** | Comunicación cliente-servidor |
| **REST**     | Arquitectura de APIs (GET, POST, PUT, DELETE) |
| **Webhooks** | Comunicación async Stripe → Backend |
| **JSON**     | Formato de datos en todas las APIs |

### Métodos de Autenticación
| Método              | Implementación |
|---------------------|---------------|
| **JWT**             | Tokens de Clerk verificados en backend |
| **Bearer Token**    | Header `Authorization: Bearer <token>` |
| **Session Cookies** | Gestionadas por Clerk |

### Métodos de Validación
| Herramienta          | Uso |
|----------------------|-----|
| **Zod**              | Validación de esquemas (frontend + backend) |
| **TypeBox**          | Tipado estático para endpoints Elysia |
| **Mongoose**         | Validación de esquemas de base de datos |
| **Stripe Signature** | Validación de webhooks con HMAC SHA256 |

### Patrones de Arquitectura
| Patrón |Implementación |
|------------------------|---------------|
| **Service Layer**      | Lógica de negocio separada en `/services` |
| **Repository Pattern** | Acceso a datos via Mongoose models |
| **Middleware Pattern** | Filtros de autenticación y CORS |
| **Webhooks**           | Reconciliación de estado async |
| **Client-Server**      | Separación frontend/backend |
| **URL-based State**    | Filtros y paginación en query strings |

---

## 🔧 Herramientas de Desarrollo

| Herramienta      | Propósito |
|------------------|-----------|
| **Git**          | Control de versiones |
| **npm/yarn/pnpm**| Gestión de paquetes (en frontend) |
| **Bun**          | Runtime y package manager (en backend) |
| **TypeScript**   | Lenguaje tipado (type safety) |
| **Vite/Next.js** | Bundling y hot reload |
| **Concurrently** | Ejecutar múltiples procesos (dev script) |
| **tsx**          | Ejecutar TypeScript directamente |
| **Stripe CLI**   | Testing de webhooks local |

---

## 📱 Responsive Design

El proyecto implementa breakpoints usando custom hooks:

```typescript
// hooks/useMediaQuery.ts
useMobile()    // max-width: 767px
useTablet()    // 768px - 1023px
useDesktop()   // min-width: 1024px
```

**Ejemplo de uso en componentes:**
```typescript
const isMobile = useMediaQuery('(max-width: 767px)');
// grid adaptativo
gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
```

---

## 🔒 Seguridad Implementada

1. **Auth via Clerk** - Tokens JWT verificados en cada request
2. **CORS** - Solo el frontend puede hacer requests
3. **Zod Validation** - Todos los inputs sanitizados
4. **Stripe Webhooks** - Firma HMAC para verificar autenticidad
5. **Environment Variables** - Secrets fuera del código fuente
6. **No SQL Injection** - Uso de Mongoose ODM
7. **HTTPS** - Requerido para Clerk y Stripe

---

## 📈 Características Principales

### Cliente
- ✅ Catálogo de pasteles con filtros por categoría
- ✅ Carrito de compras con persistencia (localStorage)
- ✅ Proceso de checkout con Stripe
- ✅ Historial de pedidos
- ✅ Autenticación con Clerk
- ✅ Diseño responsive (mobile-first)

### Administrador
- ✅ Dashboard con métricas
- ✅ Gestión de pasteles (CRUD)
- ✅ Gestión de pedidos (cambiar estado)
- ✅ Gestión de recetas
- ✅ Gestión de usuarios (roles)

### Sistema
- ✅ Emails automáticos (facturas, contacto)
- ✅ Almacenamiento de imágenes en cloud
- ✅ Pagos seguros con Stripe
- ✅ Webhooks para confirmación de pago
- ✅ Base de datos escalable (MongoDB Atlas)

---

*Documento generado para Dolce Atelier - Sistema de Gestión de Pastelería*
*Última actualización: Mayo 2026*
