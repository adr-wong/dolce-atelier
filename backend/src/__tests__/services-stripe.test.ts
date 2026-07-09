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

// Mock ../services/pedido via a factory that re-imports the REAL module and
// only overrides `confirmarPago`. This keeps every other method intact
// (so the sibling services-pedido.test.ts stays green) and avoids the
// undefined-spread leak, while also fixing the webhook test's dynamic
// import('./pedido') hang.
const confirmarPago = mock(async () => ({ _id: "p1", estado: "PAGADO" }));
mock.module("../services/pedido", async () => {
  const real = await import("../services/pedido");
  return {
    ...real,
    pedidoService: { ...real.pedidoService, confirmarPago },
  };
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
