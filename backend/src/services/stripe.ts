import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function crearSesionCheckout(params: {
  items: Array<{
    pastelId: string;
    nombre: string;
    precioSnapshot: number;
    cantidad: number;
  }>;
  pedidoId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  console.log('[STRIPE SERVICE] 🔄 crearSesionCheckout() called:', {
    pedidoId: params.pedidoId,
    itemCount: params.items.length,
    customerEmail: params.customerEmail,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
  });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => {
    const unitAmount = Math.round(item.precioSnapshot * 100 * 1.07);
    console.log('[STRIPE SERVICE] 📦 Line item:', {
      nombre: item.nombre,
      precioSnapshot: item.precioSnapshot,
      unitAmount,
      cantidad: item.cantidad,
    });
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.nombre,
        },
        unit_amount: unitAmount,
      },
      quantity: item.cantidad,
    };
  });

  console.log('[STRIPE SERVICE] 🚀 Creating Stripe checkout session...', {
    lineItemCount: lineItems.length,
    metadata: { pedidoId: params.pedidoId },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        pedidoId: params.pedidoId,
      },
      billing_address_collection: 'required',
      customer_email: params.customerEmail,
    });

    console.log('[STRIPE SERVICE] ✅ Stripe session created:', {
      sessionId: session.id,
      url: session.url ? `${session.url.substring(0, 50)}...` : 'NONE',
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
    });

    return session;
  } catch (error) {
    console.error('[STRIPE SERVICE] 💥 EXCEPTION creating session:', {
      error,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function crearSesionReceta(params: {
  recetaId: string;
  nota: string;
  cotizacion: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  const unitAmount = Math.round(params.cotizacion * 100 * 1.07);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Receta personalizada: ${params.nota.substring(0, 50)}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      recetaId: params.recetaId,
      tipo: 'receta',
    },
    billing_address_collection: 'required',
    customer_email: params.customerEmail,
  });

  return session;
}

export async function reembolsarPago(params: {
  stripeSessionId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}) {
  const session = await stripe.checkout.sessions.retrieve(params.stripeSessionId);

  if (!session.payment_intent) {
    throw new Error('No hay pago asociado a esta sesion');
  }

  const refund = await stripe.refunds.create({
    payment_intent: session.payment_intent as string,
    amount: params.amount,
    reason: params.reason || 'requested_by_customer',
  });

  return refund;
}