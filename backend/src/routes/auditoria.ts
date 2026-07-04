import { Elysia, t } from 'elysia';
import { AuditLog } from '../models';
import { verifyAdmin } from '../middleware/auth';

export const auditoriaRoutes = new Elysia({ prefix: '/api/admin/auditoria' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      set.status = 403;
      return { error: 'Acceso denegado' };
    }
  }, (app) =>
    app
      // HU-011: Consultar auditoria con filtros
      .get('/', async ({ query }) => {
        const { userId, accion, recurso, desde, hasta, limite } = query as {
          userId?: string; accion?: string; recurso?: string;
          desde?: string; hasta?: string; limite?: string;
        };

        const filtro: any = {};
        if (userId) filtro.userId = userId;
        if (accion) filtro.action = accion;
        if (recurso) filtro.resource = { $regex: recurso, $options: 'i' };
        if (desde || hasta) {
          filtro.createdAt = {};
          if (desde) filtro.createdAt.$gte = new Date(desde);
          if (hasta) filtro.createdAt.$lte = new Date(hasta);
        }

        const logs = await AuditLog.find(filtro)
          .sort({ createdAt: -1 })
          .limit(parseInt(limite || '100'));

        return { logs };
      }, {
        query: t.Object({
          userId: t.Optional(t.String()),
          accion: t.Optional(t.String()),
          recurso: t.Optional(t.String()),
          desde: t.Optional(t.String()),
          hasta: t.Optional(t.String()),
          limite: t.Optional(t.String()),
        }),
      })

      // HU-042: Admin sube foto de pastel personalizado terminado
      .post('/pedidos/:id/foto', async ({ params, body }) => {
        const { imagenUrl } = body as { imagenUrl: string };
        const { Pedido } = await import('../models');
        const pedido = await Pedido.findByIdAndUpdate(
          params.id,
          { $set: { 'metadata.fotoPastel': imagenUrl } },
          { new: true }
        );
        if (!pedido) {
          return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }
        return { success: true, pedido };
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ imagenUrl: t.String() }),
      })
  );
