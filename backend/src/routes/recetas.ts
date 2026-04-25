import { Elysia, t } from 'elysia';
import { recetaService } from '../services';
import { FiltroRecetasSchema } from '../schemas';
import { authMiddleware } from '../middleware/auth';

export const recetaRoutes = new Elysia({ prefix: '/api/recetas' })
  .get('/', async ({ query, headers }) => {
    const filtro = FiltroRecetasSchema.parse(query);
    const userId = await authMiddleware(headers);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const esAdmin = headers.get('x-user-role') === 'admin';
    const recetas = esAdmin
      ? await recetaService.listarTodos(filtro.estado)
      : await recetaService.listarPorUsuario(userId);

    return { recetas };
  })
  .get('/:id', async ({ params, headers }) => {
    const userId = await authMiddleware(headers);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const receta = await recetaService.obtener(params.id);
    if (!receta) {
      return new Response(JSON.stringify({ error: 'Receta no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const esAdmin = headers.get('x-user-role') === 'admin';
    if (!esAdmin && receta.clerkUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return { receta };
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

        const data = body as { nota: string; personas: number; archivoUrl?: string };
        const receta = await recetaService.crear(userId, data);
        return { receta };
      })
      .put('/:id', async ({ params, body }) => {
        const receta = await recetaService.actualizar(params.id, body);
        if (!receta) {
          return new Response(JSON.stringify({ error: 'Receta no encontrada' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return { receta };
      }, {
        params: t.Object({ id: t.String() }),
      })
      .put('/:id/cotizar', async ({ params, body }) => {
        const data = body as { cotizacion: number };
        const receta = await recetaService.cotizar(params.id, data.cotizacion);
        if (!receta) {
          return new Response(JSON.stringify({ error: 'Receta no encontrada' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return { receta };
      }, {
        params: t.Object({ id: t.String() }),
      })
  );