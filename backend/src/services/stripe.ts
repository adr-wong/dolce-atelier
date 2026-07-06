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
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.nombre },
      unit_amount: Math.round(item.precioSnapshot * 100),
    },
    quantity: item.cantidad,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { pedidoId: params.pedidoId },
    billing_address_collection: 'required',
    customer_email: params.customerEmail,
  });

  return session;
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

// HU-013: Procesar webhook para DLQ retry
export async function procesarWebhookStripe(payload: any) {
  const sig = payload.headers?.['stripe-signature'] || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const event = stripe.webhooks.constructEvent(
    payload.body || JSON.stringify(payload),
    sig,
    secret
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { pedidoService } = await import('./pedido');
    await pedidoService.confirmarPago(session.id);
  }

  return { success: true, eventType: event.type };
}
