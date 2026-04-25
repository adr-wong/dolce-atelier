import { Elysia } from 'elysia';
import { stripe } from '../services';
import { pedidoService } from '../services';
import Stripe from 'stripe';

export const webhookRoutes = new Elysia({ prefix: '/api/webhook' })
  .post('/stripe', async ({ request }) => {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Falta firma' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return new Response(JSON.stringify({ error: 'Firma inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await pedidoService.confirmarPago(session.id);
    }

    return { received: true };
  });