import { Pedido } from '../../models';
import { auditLogService } from '../../services/auditLog';
import type { IPedido } from '../../models/Pedido';

const allowedTransitions: Record<IPedido['estado'], IPedido['estado'][]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['LISTO', 'CANCELADO'],
  LISTO: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

type PedidoControllerContext = {
  set: { status: number };
  query: { status?: string; date?: string; page?: string; limit?: string };
  params: { id?: string };
  body: { status?: string };
};

export async function listPedidos(context: PedidoControllerContext) {
  const { set, query } = context;
  const { status, date, page, limit } = query;
  const q: Record<string, unknown> = {};
  if (status) q.estado = status;
  if (date) {
    const startDate = new Date(date);
    q.createdAt = {
      $gte: startDate,
      $lt: new Date(startDate.getTime() + 86400000)
    };
  }

  const pageNum = Number.parseInt(page || '1');
  const limitNum = Number.parseInt(limit || '12');
  const skip = (pageNum - 1) * limitNum;

  const [pedidos, total] = await Promise.all([
    Pedido.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Pedido.countDocuments(q),
  ]);

  set.status = 200;
  return {
    pedidos,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
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

  auditLogService.log({
    action: 'ADMIN_UPDATE_PEDIDO_STATUS',
    resource: `/api/admin/pedidos/${params.id}/status`,
    method: 'PUT',
    metadata: { pedidoId: params.id, oldStatus: pedido.estado, newStatus },
  });

  set.status = 200;
  return result.toJSON();
}
