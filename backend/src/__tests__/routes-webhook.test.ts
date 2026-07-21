import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { Elysia } from "elysia";
import {
  modelState,
  modelsMock,
  stripeConstructEvent,
  pedidoServiceMock,
  recetaServiceMock,
  auditLogServiceMock,
  auditLogMockModule,
  brevoMockModule,
} from "./helpers";

// The webhook route imports `stripe` from ../services — it's the Stripe SDK
// instance (new Stripe()), NOT the service wrapper. servicesMock.stripe points
// to the service wrapper. We must override it with a SDK-shaped mock.
const webhookServicesMock = {
  pedidoService: pedidoServiceMock,
  recetaService: recetaServiceMock,
  stripe: {
    webhooks: { constructEvent: stripeConstructEvent },
    checkout: { sessions: { create: mock(), retrieve: mock() } },
    refunds: { create: mock() },
  },
};

// Mock all required module paths (relative to __tests__/)
mock.module("../services", () => webhookServicesMock);
mock.module("../services/auditLog", () => auditLogMockModule);
mock.module("../services/brevo", () => brevoMockModule);
mock.module("../models", () => modelsMock);

const { webhookRoutes } = await import("../routes/webhook");

describe("webhookRoutes", () => {
  const app = new Elysia().use(webhookRoutes);
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    modelState.findOneResult = null;
    modelState.createResult = undefined;
    modelState.lastCreate = undefined;
    pedidoServiceMock.confirmarPago.mockClear();
    pedidoServiceMock.confirmarPagoConEmail.mockClear();
    recetaServiceMock.aceptar.mockClear();
    auditLogServiceMock.log.mockClear();
    brevoMockModule.enviarFacturaPedido.mockClear();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("POST /stripe returns 400 when signature is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: "test-payload",
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Falta firma");
  });

  it("POST /stripe returns 400 when signature is invalid", async () => {
    stripeConstructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: "test-payload",
        headers: { "stripe-signature": "invalid-sig" },
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Firma invalida");
  });

  it("POST /stripe skips duplicate events", async () => {
    modelState.findOneResult = { stripeEventId: "evt_123" };

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123", type: "checkout.session.completed" }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(modelState.lastCreate).toBeUndefined();
  });

  it("POST /stripe processes checkout.session.completed for pedido with email", async () => {
    modelState.findOneResult = null;
    pedidoServiceMock.confirmarPagoConEmail.mockResolvedValueOnce({
      _id: "ped_1",
      total: 100,
      items: [{ nombre: "Torta", cantidad: 1, precioSnapshot: 100 }],
      metodoEntrega: "envio",
      direccionEnvio: "Calle 123",
    });

    const session = {
      id: "sess_1",
      customer_details: { email: "test@test.com", name: "Cliente" },
      metadata: { tipo: "pedido" },
      amount_total: 10000,
    };

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: session } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    expect(res.status).toBe(200);
    // confirmarPagoConEmail is fire-and-forget, wait a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(pedidoServiceMock.confirmarPagoConEmail).toHaveBeenCalledWith("sess_1", "test@test.com");
  });

  it("POST /stripe processes checkout.session.completed for receta", async () => {
    modelState.findOneResult = null;

    const session = {
      id: "sess_2",
      customer_details: { email: "test@test.com", name: "Cliente" },
      metadata: { tipo: "receta", recetaId: "rec_123" },
      amount_total: 5000,
    };

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_2", type: "checkout.session.completed", data: { object: session } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 10));
    expect(recetaServiceMock.aceptar).toHaveBeenCalledWith("rec_123");
  });

  it("POST /stripe processes checkout.session.completed without email", async () => {
    modelState.findOneResult = null;

    const session = {
      id: "sess_3",
      customer_details: { email: null, name: null },
      metadata: { tipo: "pedido" },
      amount_total: 10000,
    };

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_3", type: "checkout.session.completed", data: { object: session } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 10));
    expect(pedidoServiceMock.confirmarPago).toHaveBeenCalledWith("sess_3");
    expect(pedidoServiceMock.confirmarPagoConEmail).not.toHaveBeenCalled();
  });

  it("POST /stripe sends invoice after confirming payment with email", async () => {
    modelState.findOneResult = null;
    pedidoServiceMock.confirmarPagoConEmail.mockResolvedValueOnce({
      _id: "ped_2",
      total: 200,
      items: [{ nombre: "Pastel", cantidad: 2, precioSnapshot: 100 }],
      metodoEntrega: "recogida",
    });

    const session = {
      id: "sess_5",
      customer_details: { email: "client@test.com", name: "Maria" },
      metadata: { tipo: "pedido" },
      amount_total: 20000,
    };

    await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_5", type: "checkout.session.completed", data: { object: session } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(brevoMockModule.enviarFacturaPedido).toHaveBeenCalledTimes(1);
    const call = brevoMockModule.enviarFacturaPedido.mock.calls[0][0];
    expect(call.email).toBe("client@test.com");
    expect(call.nombre).toBe("Maria");
    expect(call.pedidoId).toBe("ped_2");
  });

  it("POST /stripe logs audit event for checkout.session.completed", async () => {
    modelState.findOneResult = null;

    const session = {
      id: "sess_4",
      customer_details: { email: "test@test.com", name: "Cliente" },
      metadata: { tipo: "pedido" },
      amount_total: 10000,
    };

    await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_4", type: "checkout.session.completed", data: { object: session } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    // auditLogService.log is fire-and-forget
    await new Promise((r) => setTimeout(r, 10));
    expect(auditLogServiceMock.log).toHaveBeenCalledWith({
      action: "WEBHOOK_CHECKOUT_COMPLETED",
      resource: "/api/webhook/stripe",
      method: "POST",
      metadata: { sessionId: "sess_4", tipo: "pedido" },
      statusCode: 200,
    });
  });

  it("POST /stripe returns received for non-checkout events", async () => {
    modelState.findOneResult = null;

    const res = await app.handle(
      new Request("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_other", type: "payment_intent.succeeded", data: { object: {} } }),
        headers: { "stripe-signature": "valid-sig" },
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
