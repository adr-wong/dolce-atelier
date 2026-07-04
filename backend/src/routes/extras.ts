import { Elysia, t } from 'elysia';
import { Receta, Pedido } from '../models';
import { authMiddleware } from '../middleware/auth';
import { hasPermission } from '../lib/permissions';

export const recetaAbacRoutes = new Elysia({ prefix: '/api/recetas' })
  // HU-016: ABAC - acceso dinámico a recetas según rol y estado
  .get('/:id/acceso', async ({ params, headers }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const receta = await Receta.findById(params.id);
    if (!receta) {
      return new Response(JSON.stringify({ error: 'No encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ABAC: permisos según rol + estado de la receta
    const user = await (await import('../middleware/auth')).verifyToken(headers.get('Authorization'));
    const role = user?.role || 'user';

    const puedeLeer = receta.clerkUserId === userId || hasPermission(role, 'recetas', 'read');
    const puedeCotizar = hasPermission(role, 'recetas', 'update') && receta.estado === 'PENDIENTE';
    const puedeAceptar = receta.clerkUserId === userId && receta.estado === 'COTIZADA';

    return {
      recetaId: receta._id,
      estado: receta.estado,
      permisos: {
        leer: puedeLeer,
        cotizar: puedeCotizar,
        aceptar: puedeAceptar,
      },
    };
  }, {
    params: t.Object({ id: t.String() }),
  });

// HU-019: Carrito cross-device (persistir en DB)
export const carritoRoutes = new Elysia({ prefix: '/api/carrito' })
  .get('/', async ({ headers }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Leer carrito del metadata del usuario en Clerk
    const { clerkClient } = await import('../lib/clerk');
    const user = await clerkClient.users.getUser(userId);
    const carritoData = (user.publicMetadata as any)?.carrito || [];
    return { items: carritoData };
  })
  .put('/', async ({ headers, body }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { items } = body as { items: any[] };
    const { clerkClient } = await import('../lib/clerk');
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { carrito: items },
    });

    return { success: true };
  }, {
    body: t.Object({
      items: t.Array(t.Object({
        pastelId: t.String(),
        cantidad: t.Number(),
        nombre: t.String(),
        precio: t.Number(),
        imagen: t.String(),
      })),
    }),
  });

// HU-020: Cambiar método de pago
export const metodoPagoRoutes = new Elysia({ prefix: '/api/pedidos' })
  .put('/:id/metodo-pago', async ({ params, headers, body }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const pedido = await Pedido.findById(params.id);
    if (!pedido) {
      return new Response(JSON.stringify({ error: 'No encontrado' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pedido.clerkUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pedido.estado !== 'PENDIENTE') {
      return new Response(
        JSON.stringify({ error: 'Solo se puede cambiar método de pago en pedidos pendientes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Re-create Stripe session? Just update metadata for now
    pedido.save();
    return { pedido };
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ metodoPago: t.Optional(t.String()) }),
  });
