import { Pastel, Pedido, Receta } from '../../models';

export async function getDashboardStats(context: { set: { status: number }; query: Record<string, unknown>; params: Record<string, unknown>; body: Record<string, unknown> }) {
  const { set } = context;

  const totalPasteles = await Pastel.countDocuments();
  const totalPedidos = await Pedido.countDocuments();
  const totalRecetas = await Receta.countDocuments();

  const recentPedidos = await Pedido.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('estado total createdAt');

  set.status = 200;
  return {
    totalPasteles,
    totalPedidos,
    totalRecetas,
    recentPedidos: recentPedidos.map(p => ({
      id: p._id.toString(),
      status: p.estado,
      total: p.total,
      createdAt: p.createdAt.toISOString(),
    }))
  };
}