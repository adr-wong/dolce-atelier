import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';
import { reembolsarPago } from '../services/stripe';
import { Pedido } from '../models';
import { auditLogService } from '../services/auditLog';

export const reembolsoRoutes = new Elysia({ prefix: '/api/reembolsos' })
  .post('/', async ({ request, set }) => {
    const admin = await verifyAdmin(request.headers.get('Authorization'));
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      set.status = 403;
      return { error: 'Acceso denegado' };
    }

    const body = await request.json();
    const { pedidoId, amount, reason } = body as {
      pedidoId: string;
      amount?: number;
      reason?: string;
    };

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      set.status = 404;
      return { error: 'Pedido no encontrado' };
    }

    if (!pedido.stripeSessionId) {
      set.status = 400;
      return { error: 'Pedido sin sesion de Stripe' };
    }

    if (pedido.estado !== 'PAGADO') {
      set.status = 400;
      return { error: 'Solo se pueden reembolsar pedidos pagados' };
    }

    const refund = await reembolsarPago({
      stripeSessionId: pedido.stripeSessionId,
      amount,
      reason: reason as any,
    });

    pedido.estado = 'CANCELADO';
    await pedido.save();

    auditLogService.log({
      userId: admin.userId,
      action: 'REFUND_CREATED',
      resource: '/api/reembolsos',
      method: 'POST',
      metadata: {
        pedidoId: pedido._id.toString(),
        refundId: refund.id,
        amount: amount || pedido.total,
        reason,
      },
    });

    return { success: true, refundId: refund.id };
  }, {
    body: t.Object({
      pedidoId: t.String(),
      amount: t.Optional(t.Number()),
      reason: t.Optional(t.String()),
    }),
  });
