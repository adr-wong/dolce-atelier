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
      product_data: {
        name: item.nombre,
      },
      unit_amount: Math.round(item.precioSnapshot * 100 * 1.07),
    },
    quantity: item.cantidad,
  }));

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

  return session;
}