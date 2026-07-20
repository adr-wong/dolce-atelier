import { Pastel, Pedido, Receta } from '../../models';

export async function getDashboardStats(context: { set: { status: number }; query: Record<string, unknown>; params: Record<string, unknown>; body: Record<string, unknown> }) {
  const { set } = context;

  const totalPasteles = await Pastel.countDocuments();
  const totalPedidos = await Pedido.countDocuments();
  const totalRecetas = await Receta.countDocuments();
  const pedidosPendientes = await Pedido.countDocuments({ estado: 'PENDIENTE' });

  const ingresosAgg = await Pedido.aggregate([
    { $match: { estado: { $ne: 'CANCELADO' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const totalIngresos = ingresosAgg.length > 0 ? ingresosAgg[0].total : 0;

  const statusAgg = await Pedido.aggregate([
    { $group: { _id: '$estado', count: { $sum: 1 } } },
  ]);
  const statusBreakdown: Record<string, number> = {};
  statusAgg.forEach((item: { _id: string; count: number }) => {
    statusBreakdown[item._id] = item.count;
  });

  const recentPedidos = await Pedido.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('estado total createdAt items');

  set.status = 200;
  return {
    totalPasteles,
    totalPedidos,
    totalRecetas,
    pedidosPendientes,
    totalIngresos,
    statusBreakdown,
    recentPedidos: recentPedidos.map(p => ({
      _id: p._id.toString(),
      estado: p.estado,
      total: p.total,
      createdAt: p.createdAt.toISOString(),
      items: p.items || [],
    }))
  };
}