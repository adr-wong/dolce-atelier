import { Elysia, t } from 'elysia';
import { pedidoService } from '../services';
import { FiltroPedidosSchema } from '../schemas';
import { verifyToken, verifyAdmin, authMiddleware } from '../middleware/auth';

// HU-012: Idempotency store (in-memory)
const idempotencyStore = new Map<string, { response: any; createdAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of idempotencyStore) {
    if (now - v.createdAt > 86_400_000) idempotencyStore.delete(k); // 24h TTL
  }
}, 300_000);

export const pedidoRoutes = new Elysia({ prefix: '/api/pedidos' })
  .get('/', async ({ query, headers }) => {
    const filtro = FiltroPedidosSchema.parse(query);
    const userId = await authMiddleware(headers);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const esAdmin = (headers['x-user-role'] || headers['X-User-Role']) === 'admin';
    const pedidos = esAdmin
      ? await pedidoService.listarTodos(filtro.estado, filtro.limit ? parseInt(filtro.limit) : undefined)
      : await pedidoService.listarPorUsuario(userId, filtro.estado);

    return { pedidos };
  })
  .get('/:id', async ({ params, headers }) => {
    const userId = await authMiddleware(headers);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pedido = await pedidoService.obtener(params.id);
    if (!pedido) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const esAdmin = (headers['x-user-role'] || headers['X-User-Role']) === 'admin';
    if (!esAdmin && pedido.clerkUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return { pedido };
  }, {
    params: t.Object({ id: t.String() }),
  })
  .post('/', async ({ body, headers, request }) => {
        const userId = await authMiddleware(headers);

        if (!userId) {
          return new Response(JSON.stringify({ error: 'No autenticado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // HU-012: Idempotency check
        const idempotencyKey = (request as Request).headers.get('Idempotency-Key');
        if (idempotencyKey) {
          const cached = idempotencyStore.get(idempotencyKey);
          if (cached) {
            return cached.response;
          }
        }

        try {
          const result = await pedidoService.crear(userId, body);
          
          // Cache response for idempotency
          if (idempotencyKey) {
            idempotencyStore.set(idempotencyKey, {
              response: result,
              createdAt: Date.now(),
            });
          }
          
          return result;
        } catch (error) {
          console.error('[BACKEND] Error in POST /api/pedidos:', error);
          throw error;
        }
      })
      .put('/:id/estado', async ({ params, body }) => {
        const pedido = await pedidoService.actualizarEstado(params.id, body);
        if (!pedido) {
          return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return { pedido };
      }, {
        params: t.Object({ id: t.String() }),
      })
      .put('/:id/cancelar', async ({ params, headers }) => {
        const userId = await authMiddleware(headers);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'No autenticado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const pedido = await pedidoService.obtener(params.id);
        if (!pedido) {
          return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pedido.clerkUserId !== userId) {
          return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pedido.estado !== 'PENDIENTE') {
          return new Response(
            JSON.stringify({ error: 'Solo se pueden cancelar pedidos pendientes' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const actualizado = await pedidoService.actualizarEstado(params.id, {
          estado: 'CANCELADO',
        });

        return { pedido: actualizado };
      }, {
        params: t.Object({ id: t.String() }),
      })
      // HU-024: Calificar pedido entregado
      .put('/:id/calificar', async ({ params, headers, body }) => {
        const userId = await authMiddleware(headers);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'No autenticado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const pedido = await pedidoService.obtener(params.id);
        if (!pedido) {
          return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pedido.clerkUserId !== userId) {
          return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pedido.estado !== 'ENTREGADO') {
          return new Response(
            JSON.stringify({ error: 'Solo se pueden calificar pedidos entregados' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { calificacion, resena } = body as { calificacion: number; resena?: string };
        pedido.calificacion = calificacion;
        pedido.resena = resena;
        await pedido.save();

        return { pedido };
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          calificacion: t.Number({ minimum: 1, maximum: 5 }),
          resena: t.Optional(t.String({ maxLength: 500 })),
        }),
      });