import { Elysia, t } from 'elysia';
import { WebhookEvent } from '../models';
import { verifyAdmin } from '../middleware/auth';

export const dlqRoutes = new Elysia({ prefix: '/api/admin/dlq' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      set.status = 403;
      return { error: 'Acceso denegado' };
    }
  }, (app) =>
    app
      // HU-013: Listar eventos fallidos (DLQ)
      .get('/', async ({ query }) => {
        const { estado } = query as { estado?: string };
        const filtro: any = {};
        if (estado) filtro.estado = estado;
        else filtro.estado = { $in: ['FALLIDO', 'PENDIENTE_RETRY'] };

        const eventos = await WebhookEvent.find(filtro)
          .sort({ createdAt: -1 })
          .limit(50);

        return { eventos };
      }, {
        query: t.Object({ estado: t.Optional(t.String()) }),
      })

      // HU-013: Reprocesar evento fallido
      .post('/:id/reprocesar', async ({ params }) => {
        const evento = await WebhookEvent.findById(params.id);
        if (!evento) {
          return new Response(JSON.stringify({ error: 'Evento no encontrado' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }

        // Re-process webhook
        const { procesarWebhookStripe } = await import('../services/stripe');
        await procesarWebhookStripe(evento.payload);
        evento.estado = 'PROCESADO';
        evento.reintentos += 1;
        await evento.save();

        return { success: true, evento };
      }, {
        params: t.Object({ id: t.String() }),
      })
  );
