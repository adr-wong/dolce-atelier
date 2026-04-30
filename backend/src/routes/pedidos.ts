import { Elysia, t } from 'elysia';
import { pedidoService } from '../services';
import { FiltroPedidosSchema } from '../schemas';
import { verifyToken, verifyAdmin, authMiddleware } from '../middleware/auth';

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
  .post('/', async ({ body, headers }) => {
        console.log('[BACKEND] 📥 POST /api/pedidos received:', {
          timestamp: new Date().toISOString(),
          body,
          headers: {
            authorization: headers.authorization ? `${headers.authorization.substring(0, 30)}...` : 'MISSING',
            contentType: headers['content-type'],
            allHeaders: Object.keys(headers)
          }
        });

        const userId = await authMiddleware(headers);
        console.log('[BACKEND] 🔑 Auth result:', {
          userId,
          hasToken: !!headers.authorization,
          tokenPrefix: headers.authorization ? headers.authorization.substring(0, 10) : 'none'
        });

        if (!userId) {
          console.error('[BACKEND] ❌ No userId from auth! Headers:', {
            hasAuthHeader: !!headers.authorization,
            authHeaderValue: headers.authorization ? `${headers.authorization.substring(0, 20)}...` : 'MISSING'
          });
          return new Response(JSON.stringify({
            error: 'No autenticado',
            debug: {
              hasAuthHeader: !!headers.authorization,
              authHeaderStart: headers.authorization ? headers.authorization.substring(0, 10) : 'none'
            }
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          console.log('[BACKEND] 🏗️ Creating pedido for user:', userId);
          const result = await pedidoService.crear(userId, body);
          console.log('[BACKEND] ✅ Pedido created successfully:', {
            pedidoId: result.pedido?._id,
            hasCheckoutUrl: !!result.checkoutUrl,
            checkoutUrl: result.checkoutUrl ? `${result.checkoutUrl.substring(0, 50)}...` : 'NONE'
          });
          return result;
        } catch (error) {
          console.error('[BACKEND] 💥 EXCEPTION in POST /api/pedidos:', {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
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
      });