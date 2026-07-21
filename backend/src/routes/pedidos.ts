import { Elysia, t } from 'elysia';
import { pedidoService } from '../services';
import { FiltroPedidosSchema } from '../schemas';
import { authMiddleware } from '../middleware/auth';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

    if (!userId) return jsonError('No autenticado', 401);

    const esAdmin = (headers['x-user-role'] || headers['X-User-Role']) === 'admin';
    const limite = filtro.limit ? Number.parseInt(filtro.limit) : undefined;
    const pedidos = esAdmin
      ? await pedidoService.listarTodos(filtro.estado, limite)
      : await pedidoService.listarPorUsuario(userId, filtro.estado);

    return { pedidos };
  })
  .get('/:id', async ({ params, headers }) => {
    const userId = await authMiddleware(headers);

    if (!userId) return jsonError('No autenticado', 401);

    const pedido = await pedidoService.obtener(params.id);
    if (!pedido) return jsonError('Pedido no encontrado', 404);

    const esAdmin = (headers['x-user-role'] || headers['X-User-Role']) === 'admin';
    if (!esAdmin && pedido.clerkUserId !== userId) return jsonError('Acceso denegado', 403);

    return { pedido };
  }, {
    params: t.Object({ id: t.String() }),
  })
  .post('/', async ({ body, headers, request }) => {
        const userId = await authMiddleware(headers);

        if (!userId) return jsonError('No autenticado', 401);

        // HU-012: Idempotency check
        const idempotencyKey = (request as Request).headers.get('Idempotency-Key');
        if (idempotencyKey) {
          const cached = idempotencyStore.get(idempotencyKey);
          if (cached) {
            return cached.response;
          }
        }

        try {
          const pedido = await pedidoService.crear(userId, body);
          if (idempotencyKey) {
            idempotencyStore.set(idempotencyKey, {
              response: { pedido },
              createdAt: Date.now(),
            });
          }

          return { pedido };
        } catch (error) {
          console.error('[BACKEND] Error in POST /api/pedidos:', error);
          throw error;
        }
      })
      .post('/:id/pagar', async ({ params, headers, request }) => {
        const userId = await authMiddleware(headers);

        if (!userId) return jsonError('No autenticado', 401);

        try {
          const result = await pedidoService.crearSesionPago(params.id, userId);
          return result;
        } catch (err: any) {
          return jsonError(err.message, err.statusCode || 500);
        }
      })
      .put('/:id/estado', async ({ params, body, headers }) => {
        const userId = await authMiddleware(headers);
        if (!userId) return jsonError('No autenticado', 401);

        try {
          const pedido = await pedidoService.actualizarEstado(params.id, body);
          if (!pedido) return jsonError('Pedido no encontrado', 404);
          return { pedido };
        } catch (err: any) {
          return jsonError(err.message, err.statusCode || 400);
        }
      }, {
        params: t.Object({ id: t.String() }),
      })
      .put('/:id/cancelar', async ({ params, headers }) => {
        const userId = await authMiddleware(headers);
        if (!userId) return jsonError('No autenticado', 401);

        const pedido = await pedidoService.obtener(params.id);
        if (!pedido) return jsonError('Pedido no encontrado', 404);

        if (pedido.clerkUserId !== userId) return jsonError('Acceso denegado', 403);

        if (pedido.estado !== 'PENDIENTE') return jsonError('Solo se pueden cancelar pedidos pendientes', 400);

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
        if (!userId) return jsonError('No autenticado', 401);

        const pedido = await pedidoService.obtener(params.id);
        if (!pedido) return jsonError('Pedido no encontrado', 404);

        if (pedido.clerkUserId !== userId) return jsonError('Acceso denegado', 403);

        if (pedido.estado !== 'ENTREGADO') return jsonError('Solo se pueden calificar pedidos entregados', 400);

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