import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));

    if (!admin) {
      set.status = 401;
      return { error: 'No autenticado' };
    }

    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      set.status = 403;
      return { error: 'Acceso denegado. Se requiere rol admin.' };
    }
  }, (app) =>
    app.get('/stats', async () => {
      const { pedidoService, recetaService, pastelService } = await import('../services');
      const [pedidosHoy, recetasPendientes, productos, ingresosMes] = await Promise.all([
        pedidoService.contarPedidosHoy(),
        recetaService.contarPendientes(),
        pastelService.listar(),
        pedidoService.calcularIngresosMes(),
      ]);

      return {
        stats: {
          pedidosHoy,
          recetasPendientes,
          productos: productos.length,
          ingresosMes,
        },
      };
    })
  );