import { Elysia, t } from 'elysia';
import { Pedido } from '../models';
import { verifyAdmin } from '../middleware/auth';

export const reportesRoutes = new Elysia({ prefix: '/api/admin/reportes' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      set.status = 403;
      return { error: 'Acceso denegado' };
    }
  }, (app) =>
    app
      // HU-033: Reporte de ventas con filtro por periodo
      .get('/ventas', async ({ query }) => {
        const { periodo, desde, hasta } = query as {
          periodo?: string;
          desde?: string;
          hasta?: string;
        };

        let match: any = { estado: { $in: ['PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO'] } };

        // Calcular rango de fechas según periodo
        const ahora = new Date();
        let fechaInicio: Date;

        if (desde && hasta) {
          fechaInicio = new Date(desde);
          match.createdAt = { $gte: new Date(desde), $lte: new Date(hasta) };
        } else {
          switch (periodo) {
            case 'semana':
              fechaInicio = new Date(ahora);
              fechaInicio.setDate(ahora.getDate() - 7);
              break;
            case 'mes':
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
              break;
            case 'año':
            case 'ano':
              fechaInicio = new Date(ahora.getFullYear(), 0, 1);
              break;
            default:
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          }
          match.createdAt = { $gte: fechaInicio };
        }

        const pipeline = [
          { $match: match },
          {
            $group: {
              _id: null,
              totalVentas: { $sum: '$total' },
              numeroPedidos: { $sum: 1 },
              ticketPromedio: { $avg: '$total' },
            },
          },
        ];

        const [result] = await Pedido.aggregate(pipeline);

        return {
          periodo: periodo || 'mes',
          totalVentas: result?.totalVentas || 0,
          numeroPedidos: result?.numeroPedidos || 0,
          ticketPromedio: Math.round(result?.ticketPromedio || 0),
          desde: match.createdAt?.$gte || fechaInicio,
        };
      }, {
        query: t.Object({
          periodo: t.Optional(t.String()),
          desde: t.Optional(t.String()),
          hasta: t.Optional(t.String()),
        }),
      })

      // HU-034: Exportar pedidos a CSV
      .get('/ventas/csv', async ({ query, set }) => {
        const { periodo, desde, hasta } = query as {
          periodo?: string;
          desde?: string;
          hasta?: string;
        };

        let match: any = {};

        const ahora = new Date();
        let fechaInicio: Date;

        if (desde && hasta) {
          fechaInicio = new Date(desde);
          match.createdAt = { $gte: new Date(desde), $lte: new Date(hasta) };
        } else {
          switch (periodo) {
            case 'semana':
              fechaInicio = new Date(ahora);
              fechaInicio.setDate(ahora.getDate() - 7);
              break;
            case 'mes':
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
              break;
            case 'año':
            case 'ano':
              fechaInicio = new Date(ahora.getFullYear(), 0, 1);
              break;
            default:
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          }
          match.createdAt = { $gte: fechaInicio };
        }

        const pedidos = await Pedido.find(match)
          .sort({ createdAt: -1 })
          .limit(1000)
          .lean();

        // Build CSV
        const header = 'ID,Email,Estado,Total,Método Entrega,Fecha\n';
        const rows = pedidos.map((p: any) => {
          const id = p._id.toString();
          const email = (p.email || '').replace(/,/g, ' ');
          const estado = p.estado;
          const total = p.total;
          const metodo = p.metodoEntrega || '';
          const fecha = p.createdAt ? new Date(p.createdAt).toISOString() : '';
          return `${id},${email},${estado},${total},${metodo},${fecha}`;
        });

        const csv = header + rows.join('\n');

        set.headers = {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pedidos-${periodo || 'mes'}.csv"`,
        };

        return csv;
      }, {
        query: t.Object({
          periodo: t.Optional(t.String()),
          desde: t.Optional(t.String()),
          hasta: t.Optional(t.String()),
        }),
      })

      // HU-036: Pasteles más vendidos
      .get('/mas-vendidos', async ({ query }) => {
        const { limite } = query as { limite?: string };
        const limit = parseInt(limite || '10');

        const pipeline = [
          { $match: { estado: { $in: ['PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO'] } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.nombre',
              pastelId: { $first: '$items.pastelId' },
              totalVendido: { $sum: '$items.cantidad' },
              ingresos: { $sum: { $multiply: ['$items.precioSnapshot', '$items.cantidad'] } },
            },
          },
          { $sort: { totalVendido: -1 } },
          { $limit: limit },
        ];

        const resultados = await Pedido.aggregate(pipeline);

        return {
          masVendidos: resultados.map(r => ({
            nombre: r._id,
            pastelId: r.pastelId,
            totalVendido: r.totalVendido,
            ingresos: r.ingresos,
          })),
        };
      }, {
        query: t.Object({
          limite: t.Optional(t.String()),
        }),
      })
  );
