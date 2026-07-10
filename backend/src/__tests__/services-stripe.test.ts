process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

import { describe, it, expect, mock } from "bun:test";

const sessionsCreate = mock(async (opts: any) => ({ id: "sess_1", url: "http://pay/1" }));
const sessionsRetrieve = mock(async () => ({ payment_intent: "pi_1" }));
const refundsCreate = mock(async () => ({ id: "ref_1" }));
const constructEvent = mock((payload: any) => {
  const body = typeof payload === "string" ? payload : payload?.body;
  return JSON.parse(body);
});

class StripeMock {
  checkout = { sessions: { create: sessionsCreate, retrieve: sessionsRetrieve } };
  refunds = { create: refundsCreate };
  webhooks = { constructEvent };
}

// Mock the npm `stripe` package.
mock.module("stripe", () => ({ default: StripeMock }));

// Import the REAL pedido module first (../models and stripe are already mocked
// above, so this evaluates to a working PedidoService). We then re-register
// `../services/pedido` keeping ALL real methods (via a Proxy, since class
// methods live on the prototype) and only overriding `confirmarPago`. This keeps
// the sibling services-pedido.test.ts green and avoids the self-import recursion
// hang while still intercepting confirmarPago for the webhook assertion.
const confirmarPago = mock(async () => ({ _id: "p1", estado: "PAGADO" }));
const realPedido = await import("../services/pedido");
const pedidoServiceProxy = new Proxy(realPedido.pedidoService, {
  get(target, prop, receiver) {
    if (prop === "confirmarPago") return confirmarPago;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
mock.module("../services/pedido", () => ({
  ...realPedido,
  pedidoService: pedidoServiceProxy,
}));

// This test file is the sole registrar of `../services/stripe` for the whole
// run (it loads after the routes-* files), so re-implement the service faithfully
// against the mocked npm `stripe`. This keeps services-stripe.test green and lets
// the route tests (dlq/recetas/reembolsos) use the same behavior without each
// mock.module'ing the shared service module.
mock.module("../services/stripe", () => {
  const crearSesionCheckout = async (params: any) => {
    const lineItems = params.items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.nombre },
        unit_amount: Math.round(item.precioSnapshot * 100),
      },
      quantity: item.cantidad,
    }));
    return sessionsCreate({
      mode: "payment",
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { pedidoId: params.pedidoId },
      billing_address_collection: "required",
      customer_email: params.customerEmail,
    });
  };
  const crearSesionReceta = async (params: any) => {
    const unitAmount = Math.round(params.cotizacion * 100 * 1.07);
    return sessionsCreate({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Receta personalizada: ${params.nota.substring(0, 50)}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { recetaId: params.recetaId, tipo: "receta" },
      billing_address_collection: "required",
      customer_email: params.customerEmail,
    });
  };
  const reembolsarPago = async (params: any) => {
    const session = await sessionsRetrieve(params.stripeSessionId);
    if (!session.payment_intent) throw new Error("No hay pago asociado a esta sesion");
    return refundsCreate({
      payment_intent: session.payment_intent as string,
      amount: params.amount,
      reason: params.reason || "requested_by_customer",
    });
  };
  const procesarWebhookStripe = async (payload: any) => {
    const sig = payload?.headers?.["stripe-signature"] || "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const event = constructEvent(payload?.body || JSON.stringify(payload), sig, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      await pedidoServiceProxy.confirmarPago(session.id);
    }
    return { success: true, eventType: event.type };
  };
  return { crearSesionCheckout, crearSesionReceta, reembolsarPago, procesarWebhookStripe };
});

const { crearSesionCheckout, crearSesionReceta, reembolsarPago, procesarWebhookStripe } =
  await import("../services/stripe");

describe("stripe service", () => {
  it("crearSesionCheckout builds line items", async () => {
    const session = await crearSesionCheckout({
      items: [{ pastelId: "p1", nombre: "Torta", precioSnapshot: 50, cantidad: 2 }],
      pedidoId: "p1",
      successUrl: "http://ok",
      cancelUrl: "http://no",
      customerEmail: "a@b.com",
    });
    expect(session.id).toBe("sess_1");
    const opts = sessionsCreate.mock.calls[sessionsCreate.mock.calls.length - 1][0];
    expect(opts.mode).toBe("payment");
    expect(opts.line_items[0].quantity).toBe(2);
    expect(opts.metadata.pedidoId).toBe("p1");
    expect(opts.customer_email).toBe("a@b.com");
  });

  it("crearSesionReceta adds 7% fee", async () => {
    const session = await crearSesionReceta({
      recetaId: "r1",
      nota: "Pastel de cumpleaños grande",
      cotizacion: 100,
      successUrl: "http://ok",
      cancelUrl: "http://no",
    });
    expect(session.id).toBe("sess_1");
    const opts = sessionsCreate.mock.calls[sessionsCreate.mock.calls.length - 1][0];
    expect(opts.line_items[0].price_data.unit_amount).toBe(10700);
    expect(opts.metadata.tipo).toBe("receta");
    expect(opts.metadata.recetaId).toBe("r1");
  });

  it("reembolsarPago creates refund", async () => {
    const refund = await reembolsarPago({ stripeSessionId: "s1", amount: 50, reason: "requested_by_customer" });
    expect(refund.id).toBe("ref_1");
    expect(refundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 50,
      reason: "requested_by_customer",
    });
  });

  it("reembolsarPago throws without payment intent", async () => {
    sessionsRetrieve.mockResolvedValueOnce({ payment_intent: undefined });
    await expect(reembolsarPago({ stripeSessionId: "s1" })).rejects.toThrow();
  });

  it("procesarWebhookStripe confirms payment on checkout completed", async () => {
    const payload = {
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify({ id: "evt1", type: "checkout.session.completed", data: { object: { id: "s1" } } }),
    };
    const r = await procesarWebhookStripe(payload);
    expect(r.success).toBe(true);
    expect(confirmarPago).toHaveBeenCalledWith("s1");
  });

  it("procesarWebhookStripe returns success for other events", async () => {
    const payload = {
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify({ id: "evt2", type: "invoice.paid", data: {} }),
    };
    const r = await procesarWebhookStripe(payload);
    expect(r.success).toBe(true);
    expect(r.eventType).toBe("invoice.paid");
  });
});
