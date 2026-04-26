import { Elysia, t } from 'elysia';
import { pastelService } from '../services';
import { FiltroPastelesSchema } from '../schemas';
import { verifyToken, verifyAdmin, authMiddleware } from '../middleware/auth';

export const pastelRoutes = new Elysia({ prefix: '/api/pasteles' })
  .get('/', async ({ query }) => {
    const filtro = FiltroPastelesSchema.parse(query);
    const pasteles = await pastelService.listar(filtro.categoria);
    return { pasteles };
  })
  .get('/:id', async ({ params }) => {
    const pastel = await pastelService.obtener(params.id);
    if (!pastel) {
      return new Response(JSON.stringify({ error: 'Pastel no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return pastel;
  }, {
    params: t.Object({ id: t.String() }),
  })
  .guard(
    { preHandler: authMiddleware },
    (app) => app
      .post('/', async ({ body }) => {
        const pastel = await pastelService.crear(body);
        return { pastel };
      }, {
        body: 'Pastel',
      })
      .put('/:id', async ({ params, body }) => {
        const pastel = await pastelService.actualizar(params.id, body);
        if (!pastel) {
          return new Response(JSON.stringify({ error: 'Pastel no encontrado' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return { pastel };
      }, {
        params: t.Object({ id: t.String() }),
      })
      .delete('/:id', async ({ params }) => {
        const eliminado = await pastelService.eliminar(params.id);
        if (!eliminado) {
          return new Response(JSON.stringify({ error: 'Pastel no encontrado' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return { success: true };
      }, {
        params: t.Object({ id: t.String() }),
      })
  );