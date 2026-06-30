import { Elysia, t } from 'elysia';
import { recetaService } from '../services';
import { crearSesionReceta } from '../services/stripe';
import { FiltroRecetasSchema } from '../schemas';
import { authMiddleware } from '../middleware/auth';

export const recetaRoutes = new Elysia({ prefix: '/api/recetas' })
  .resolve(async ({ headers }) => {
    const userId = await authMiddleware(headers);
    const esAdmin = (headers['x-user-role'] || headers['X-User-Role']) === 'admin';
    return { userId, esAdmin };
  })
  .get('/', async ({ query, userId, esAdmin }) => {
    const filtro = FiltroRecetasSchema.parse(query);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recetas = esAdmin
      ? await recetaService.listarTodos(filtro.estado)
      : await recetaService.listarPorUsuario(userId);

    return { recetas };
  })
  .get('/:id', async ({ params, userId, esAdmin }) => {
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
  .post('/', async ({ body, userId }) => {
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
  .post('/:id/aceptar-pagar', async ({ params, userId, headers }) => {
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

    if (receta.clerkUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (receta.estado !== 'COTIZADA' || !receta.cotizacion) {
      return new Response(JSON.stringify({ error: 'La receta no tiene cotización pendiente' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await crearSesionReceta({
      recetaId: receta._id.toString(),
      nota: receta.nota,
      cotizacion: receta.cotizacion,
      successUrl: `${frontendUrl}/checkout/receta/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/recetas/mis`,
      customerEmail: headers.get('x-user-email') || undefined,
    });

    return { sessionId: session.id, url: session.url };
  }, {
    params: t.Object({ id: t.String() }),
  });
