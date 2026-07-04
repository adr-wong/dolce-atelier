import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('[STRIPE] STRIPE_SECRET_KEY no configurada - usando modo mock');
      // Retornar un Stripe fake para desarrollo
      _stripe = new Stripe('sk_test_mock_development_key', {
        apiVersion: '2024-12-18.acacia',
      });
    } else {
      _stripe = new Stripe(key, {
        apiVersion: '2024-12-18.acacia',
      });
    }
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
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
  const stripeClient = getStripe();
  const isMock = !process.env.STRIPE_SECRET_KEY;

  if (isMock) {
    console.log('[STRIPE MOCK] Creando sesion fake para pedido:', params.pedidoId);
    return {
      id: `cs_mock_${Date.now()}`,
      url: `${params.successUrl.replace('{CHECKOUT_SESSION_ID}', `cs_mock_${Date.now()}`)}`,
      payment_status: 'unpaid',
    } as any;
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.nombre },
      unit_amount: Math.round(item.precioSnapshot * 100),
    },
    quantity: item.cantidad,
  }));

  return stripeClient.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { pedidoId: params.pedidoId },
    billing_address_collection: 'required',
    customer_email: params.customerEmail,
  });
}

export async function crearSesionReceta(params: {
  recetaId: string;
  nota: string;
  cotizacion: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  const stripeClient = getStripe();
  const isMock = !process.env.STRIPE_SECRET_KEY;

  if (isMock) {
    return {
      id: `cs_mock_${Date.now()}`,
      url: params.successUrl.replace('{CHECKOUT_SESSION_ID}', `cs_mock_${Date.now()}`),
      payment_status: 'unpaid',
    } as any;
  }

  return stripeClient.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Receta: ${params.nota.substring(0, 50)}` },
        unit_amount: Math.round(params.cotizacion * 100),
      },
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { recetaId: params.recetaId, tipo: 'receta' },
    billing_address_collection: 'required',
    customer_email: params.customerEmail,
  });
}

export async function reembolsarPago(params: {
  stripeSessionId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}) {
  const stripeClient = getStripe();
  const isMock = !process.env.STRIPE_SECRET_KEY;

  if (isMock) {
    return { id: `re_mock_${Date.now()}`, status: 'succeeded' };
  }

  const session = await stripeClient.checkout.sessions.retrieve(params.stripeSessionId);
  if (!session.payment_intent) {
    throw new Error('No hay pago asociado a esta sesion');
  }

  return stripeClient.refunds.create({
    payment_intent: session.payment_intent as string,
    amount: params.amount,
    reason: params.reason || 'requested_by_customer',
  });
}

// HU-013: Procesar webhook para DLQ retry
export async function procesarWebhookStripe(payload: any) {
  const stripeClient = getStripe();
  const sig = payload.headers?.['stripe-signature'] || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripeClient.webhooks.constructEvent(
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
  } catch (error: any) {
    throw new Error(`Webhook processing failed: ${error.message}`);
  }
}
