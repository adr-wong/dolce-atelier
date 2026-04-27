import { Pedido } from '../../models';
import type { IPedido } from '../../models/Pedido';

const allowedTransitions: Record<IPedido['estado'], IPedido['estado'][]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
  PAGADO: ['CONFIRMADO', 'CANCELADO'],
};

type PedidoControllerContext = {
  set: { status: number };
  query: { status?: string; date?: string };
  params: { id?: string };
  body: { status?: string };
};

export async function listPedidos(context: PedidoControllerContext) {
  const { set, query } = context;
  const { status, date } = query;
  const q: Record<string, unknown> = {};
  if (status) q.estado = status;
  if (date) {
    const startDate = new Date(date);
    q.createdAt = {
      $gte: startDate,
      $lt: new Date(startDate.getTime() + 86400000)
    };
  }
  const pedidos = await Pedido.find(q);
  set.status = 200;
  return pedidos;
}

export async function updatePedidoStatus(context: PedidoControllerContext) {
  const { set, params, body } = context;
  const newStatus = body.status as IPedido['estado'];
  const pedido = await Pedido.findById(params.id);
  if (!pedido) {
    set.status = 404;
    return { error: 'Pedido no encontrado' };
  }
  if (!allowedTransitions[pedido.estado]?.includes(newStatus)) {
    set.status = 400;
    return { error: `Transición no válida de ${pedido.estado} a ${newStatus}` };
  }
  const result = await Pedido.findByIdAndUpdate(
    params.id,
    { $set: { estado: newStatus, updatedAt: new Date() } },
    { new: true }
  );
  set.status = 200;
  return result;
}