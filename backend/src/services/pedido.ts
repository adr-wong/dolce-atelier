import { Pedido, Pastel } from '../models';
import type { IPedido } from '../models/Pedido';
import { CrearPedidoSchema, ActualizarEstadoSchema } from '../schemas/pedido';
import { crearSesionCheckout } from './stripe';

export class PedidoService {
  async listarPorUsuario(clerkUserId: string, estado?: string): Promise<IPedido[]> {
    const filtro: Record<string, unknown> = { clerkUserId };
    if (estado) filtro.estado = estado;
    return Pedido.find(filtro).sort({ createdAt: -1 });
  }

  async listarTodos(estado?: string, limit?: number): Promise<IPedido[]> {
    const filtro = estado ? { estado } : {};
    return Pedido.find(filtro).sort({ createdAt: -1 }).limit(limit || 100);
  }

  async obtener(id: string): Promise<IPedido | null> {
    return Pedido.findById(id);
  }

  async obtenerPorStripeId(stripeSessionId: string): Promise<IPedido | null> {
    return Pedido.findOne({ stripeSessionId });
  }

  async crear(clerkUserId: string, data: unknown): Promise<{ pedido: IPedido; checkoutUrl: string }> {
    const validado = CrearPedidoSchema.parse(data);

    const pastelIds = validado.items.map(i => i.pastelId);
    const pasteles = await Pastel.find({ _id: { $in: pastelIds } });
    const pastelMap = new Map(pasteles.map(p => [p._id.toString(), p]));

    const items = validado.items.map(item => {
      const pastel = pastelMap.get(item.pastelId);
      if (!pastel) throw new Error(`Pastel ${item.pastelId} no encontrado`);
      return {
        pastelId: pastel._id,
        nombre: pastel.nombre,
        precioSnapshot: pastel.precio,
        cantidad: item.cantidad,
      };
    });

    const total = items.reduce((sum, item) => sum + item.precioSnapshot * item.cantidad, 0);

    const pedido = await Pedido.create({
      clerkUserId,
      estado: 'PENDIENTE',
      total,
      items,
      metodoEntrega: validado.metodoEntrega,
      direccionEnvio: validado.direccionEnvio,
      telefono: validado.telefono,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await crearSesionCheckout({
      items,
      pedidoId: pedido._id.toString(),
      successUrl: `${frontendUrl}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/checkout/error`,
    });

    pedido.stripeSessionId = session.id;
    await pedido.save();

    return { pedido, checkoutUrl: session.url! };
  }

  async actualizarEstado(id: string, data: unknown): Promise<IPedido | null> {
    const validado = ActualizarEstadoSchema.parse(data);
    return Pedido.findByIdAndUpdate(id, validado, { new: true });
  }

  async confirmarPago(stripeSessionId: string): Promise<IPedido | null> {
    return Pedido.findOneAndUpdate(
      { stripeSessionId, estado: 'PENDIENTE' },
      { estado: 'PAGADO' },
      { new: true }
    );
  }

  async contarPedidosHoy(): Promise<number> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Pedido.countDocuments({ createdAt: { $gte: hoy } });
  }

  async calcularIngresosMes(): Promise<number> {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);

    const pedidos = await Pedido.find({
      createdAt: { $gte: inicio },
      estado: { $ne: 'CANCELADO' },
    });

    return pedidos.reduce((sum, p) => sum + p.total, 0);
  }
}

export const pedidoService = new PedidoService();