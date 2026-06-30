import { Elysia } from 'elysia';
import { stripe, pedidoService, recetaService } from '../services';
import { enviarFacturaPedido } from '../services/brevo';
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
      const email = session.customer_details?.email;
      const customerName = session.customer_details?.name;
      const tipo = session.metadata?.tipo;

      console.log('\n========== WEBHOOK STRIPE ==========');
      console.log('Evento: checkout.session.completed');
      console.log('Session ID:', session.id);
      console.log('Tipo:', tipo || 'pedido');
      console.log('Customer Email:', email);
      console.log('Customer Name:', customerName);
      console.log('Amount Total:', session.amount_total);
      console.log('====================================\n');

      if (tipo === 'receta') {
        const recetaId = session.metadata?.recetaId;
        if (recetaId) {
          console.log(`[WEBHOOK] Confirmando pago de receta: ${recetaId}`);
          await recetaService.aceptar(recetaId);
          console.log(`[WEBHOOK] Receta ${recetaId} marcada como ACEPTADA`);
        }
      } else {
        if (email) {
          console.log('[WEBHOOK] Confirmando pago y enviando factura...');
          const pedido = await pedidoService.confirmarPagoConEmail(session.id, email);

          if (pedido) {
            console.log(`[WEBHOOK] Pedido confirmado ID: ${pedido._id.toString()}`);
            console.log(`[WEBHOOK] Enviando factura a ${email}...`);
            await enviarFacturaPedido({
              email,
              nombre: customerName || 'Cliente',
              pedidoId: pedido._id.toString(),
              total: pedido.total,
              items: pedido.items.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precioSnapshot: item.precioSnapshot,
              })),
              metodoEntrega: pedido.metodoEntrega,
              direccionEnvio: pedido.direccionEnvio,
            });
          } else {
            console.log('[WEBHOOK] ❌ No se encontró pedido para esta session');
          }
        } else {
          console.log('[WEBHOOK] No hay email del cliente, solo se confirma pago');
          await pedidoService.confirmarPago(session.id);
        }
      }
    }

    return { received: true };
  });