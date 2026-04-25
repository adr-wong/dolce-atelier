import { Elysia, t } from 'elysia';
import { pedidoService } from '../services';
import { FiltroPedidosSchema } from '../schemas';
import { authMiddleware } from '../middleware/auth';

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

    const esAdmin = headers.get('x-user-role') === 'admin';
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

    const esAdmin = headers.get('x-user-role') === 'admin';
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
  .guard(
    { preHandler: authMiddleware },
    (app) => app
      .post('/', async ({ body, headers }) => {
        const userId = await authMiddleware(headers);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'No autenticado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const result = await pedidoService.crear(userId, body);
        return result;
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
  );