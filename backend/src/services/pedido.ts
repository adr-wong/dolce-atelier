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
    console.log('[PEDIDO SERVICE] 🏗️ crear() called:', {
      clerkUserId,
      data,
      timestamp: new Date().toISOString()
    });

    try {
      console.log('[PEDIDO SERVICE] 🔍 Validating with Zod schema...');
      const validado = CrearPedidoSchema.parse(data);
      console.log('[PEDIDO SERVICE] ✅ Schema validation passed:', {
        itemCount: validado.items.length,
        metodoEntrega: validado.metodoEntrega,
        hasDireccion: !!validado.direccionEnvio
      });

      const pastelIds = validado.items.map(i => i.pastelId);
      console.log('[PEDIDO SERVICE] 🔍 Looking up pasteles:', pastelIds);

      const pasteles = await Pastel.find({ _id: { $in: pastelIds } });
      console.log('[PEDIDO SERVICE] 📦 Pasteles found:', pasteles.map(p => ({
        id: p._id,
        nombre: p.nombre,
        precio: p.precio
      })));

      if (pasteles.length !== pastelIds.length) {
        console.error('[PEDIDO SERVICE] ❌ Some pasteles not found!', {
          requested: pastelIds,
          found: pasteles.map(p => p._id.toString())
        });
      }

      const pastelMap = new Map(pasteles.map(p => [p._id.toString(), p]));

      const items = validado.items.map(item => {
        const pastel = pastelMap.get(item.pastelId);
        if (!pastel) {
          console.error('[PEDIDO SERVICE] ❌ Pastel not found:', item.pastelId);
          throw new Error(`Pastel ${item.pastelId} no encontrado`);
        }
        return {
          pastelId: pastel._id,
          nombre: pastel.nombre,
          precioSnapshot: pastel.precio,
          cantidad: item.cantidad,
        };
      });

      const total = items.reduce((sum, item) => sum + item.precioSnapshot * item.cantidad, 0);
      console.log('[PEDIDO SERVICE] 💰 Total calculated:', { total, itemCount: items.length });

      console.log('[PEDIDO SERVICE] 💾 Saving pedido to MongoDB...');
      const pedido = await Pedido.create({
        clerkUserId,
        email: validado.email,
        estado: 'PENDIENTE',
        total,
        items,
        metodoEntrega: validado.metodoEntrega,
        direccionEnvio: validado.direccionEnvio,
        telefono: validado.telefono,
      });
      console.log('[PEDIDO SERVICE] ✅ Pedido saved to DB:', {
        pedidoId: pedido._id,
        estado: pedido.estado,
        total: pedido.total
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('[PEDIDO SERVICE] 🔄 Creating Stripe session...', {
        frontendUrl,
        pedidoId: pedido._id,
        successUrl: `${frontendUrl}/checkout/exito?session_id={CHECKOUT_SESSION_ID}&order_id=${pedido._id}`,
        cancelUrl: `${frontendUrl}/checkout/error`
      });

      const session = await crearSesionCheckout({
        items,
        pedidoId: pedido._id.toString(),
        successUrl: `${frontendUrl}/checkout/exito?session_id={CHECKOUT_SESSION_ID}&order_id=${pedido._id}`,
        cancelUrl: `${frontendUrl}/checkout/error`,
        customerEmail: validado.email,
      });

      console.log('[PEDIDO SERVICE] ✅ Stripe session created:', {
        sessionId: session.id,
        checkoutUrl: session.url ? `${session.url.substring(0, 50)}...` : 'NONE',
        paymentStatus: (session as any).payment_status
      });

      pedido.stripeSessionId = session.id;
      await pedido.save();
      console.log('[PEDIDO SERVICE] 💾 Stripe session ID saved to pedido');

      return { pedido, checkoutUrl: session.url! };
    } catch (error) {
      console.error('[PEDIDO SERVICE] 💥 EXCEPTION in crear():', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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

  async confirmarPagoConEmail(stripeSessionId: string, email: string): Promise<IPedido | null> {
    return Pedido.findOneAndUpdate(
      { stripeSessionId, estado: 'PENDIENTE' },
      { estado: 'PAGADO', email },
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