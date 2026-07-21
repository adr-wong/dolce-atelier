import { describe, it, expect, mock, beforeEach, beforeAll } from "bun:test";
import { modelsMock, modelState, stripeCheckoutCreate, stripeCheckoutRetrieve } from "./helpers";

mock.module("../models", () => modelsMock);

const stripeSdkMock = {
  checkout: { sessions: { create: stripeCheckoutCreate, retrieve: stripeCheckoutRetrieve } },
  refunds: { create: mock() },
  webhooks: { constructEvent: mock() },
};
mock.module("../services/stripe", () => ({
  stripe: stripeSdkMock,
  crearSesionCheckout: stripeCheckoutCreate,
  crearSesionReceta: mock(),
  reembolsarPago: mock(),
  procesarWebhookStripe: mock(),
}));

const state = modelState;
let pedidoService: typeof import("../services/pedido").pedidoService;

beforeAll(async () => {
  const mod = await import("../services/pedido");
  pedidoService = mod.pedidoService;
});

beforeEach(() => {
  stripeCheckoutCreate.mockClear();
  stripeCheckoutRetrieve.mockClear();
  stripeCheckoutCreate.mockImplementation(async () => ({ id: "sess_1", url: "http://pay/1" }));
  stripeCheckoutRetrieve.mockImplementation(async () => ({ payment_intent: "pi_1" }));
});

describe("PedidoService", () => {
  it("listarPorUsuario filters by user", async () => {
    state.findResult = [{ _id: "p1" }];
    const r = await pedidoService.listarPorUsuario("u1");
    expect(r).toHaveLength(1);
  });

  it("listarTodos applies estado/limit", async () => {
    state.findResult = [{ _id: "a" }, { _id: "b" }];
    const r = await pedidoService.listarTodos("PAGADO", 5);
    expect(r).toHaveLength(2);
  });

  it("obtener by id", async () => {
    state.findByIdResult = { _id: "p1" };
    expect((await pedidoService.obtener("p1"))?._id).toBe("p1");
  });

  it("obtenerPorStripeId", async () => {
    state.findOneResult = { _id: "p1", stripeSessionId: "s1" };
    expect((await pedidoService.obtenerPorStripeId("s1"))?.stripeSessionId).toBe("s1");
  });

  it("crear validates and returns pedido", async () => {
    state.findResult = [{ _id: "past1", nombre: "Torta", precio: 50 }];
    const save = mock(async () => ({}));
    state.createResult = { _id: "p1", save };
    const data = {
      email: "a@b.com",
      items: [{ pastelId: "past1", cantidad: 2 }],
      metodoEntrega: "DOMICILIO" as const,
      telefono: "999",
      direccionEnvio: "Calle",
    };
    const result = await pedidoService.crear("u1", data);
    expect(result._id).toBe("p1");
  });

  it("crear throws on invalid data", async () => {
    await expect(pedidoService.crear("u1", { email: "bad" } as any)).rejects.toBeDefined();
  });

  it("actualizarEstado validates estado", async () => {
    state.findByIdResult = { _id: "p1", estado: "PENDIENTE" };
    state.findByIdAndUpdateResult = { _id: "p1", estado: "PAGADO" };
    const r = await pedidoService.actualizarEstado("p1", { estado: "PAGADO" });
    expect(r?.estado).toBe("PAGADO");
  });

  it("actualizarEstado throws on invalid estado", async () => {
    await expect(pedidoService.actualizarEstado("p1", { estado: "X" } as any)).rejects.toBeDefined();
  });

  it("confirmarPago", async () => {
    state.findOneAndUpdateResult = { _id: "p1", estado: "PAGADO" };
    const r = await pedidoService.confirmarPago("s1");
    expect(r?.estado).toBe("PAGADO");
  });

  it("confirmarPagoConEmail", async () => {
    state.findOneAndUpdateResult = { _id: "p1", estado: "PAGADO" };
    const r = await pedidoService.confirmarPagoConEmail("s1", "a@b.com");
    expect(r?.estado).toBe("PAGADO");
  });

  it("contarPedidosHoy counts documents", async () => {
    state.countResult = 7;
    expect(await pedidoService.contarPedidosHoy()).toBe(7);
  });

  it("calcularIngresosMes sums totals", async () => {
    state.findResult = [{ total: 100 }, { total: 50 }, { total: 25 }];
    expect(await pedidoService.calcularIngresosMes()).toBe(175);
  });
});

describe("PedidoService.crearSesionPago", () => {
  it("throws 404 when pedido not found", async () => {
    state.findByIdResult = null;
    await expect(pedidoService.crearSesionPago("p1", "u1")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 403 when user does not own the pedido", async () => {
    state.findByIdResult = { _id: "p1", clerkUserId: "other", estado: "PENDIENTE" };
    await expect(pedidoService.crearSesionPago("p1", "u1")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 400 when pedido is not PENDIENTE", async () => {
    state.findByIdResult = { _id: "p1", clerkUserId: "u1", estado: "PAGADO" };
    await expect(pedidoService.crearSesionPago("p1", "u1")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("returns success URL and updates pedido when existing session is already paid", async () => {
    const save = mock(async () => ({}));
    state.findByIdResult = { _id: "p1", clerkUserId: "u1", estado: "PENDIENTE", stripeSessionId: "sess_old", save };
    stripeCheckoutRetrieve.mockResolvedValueOnce({ id: "sess_old", payment_status: "paid" });
    const r = await pedidoService.crearSesionPago("p1", "u1");
    expect(r.checkoutUrl).toContain("/checkout/exito?session_id=sess_old&order_id=p1");
    expect(r.stripeSessionId).toBe("sess_old");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("returns existing session URL when session is open", async () => {
    const save = mock(async () => ({}));
    state.findByIdResult = { _id: "p1", clerkUserId: "u1", estado: "PENDIENTE", stripeSessionId: "sess_old", save };
    stripeCheckoutRetrieve.mockResolvedValueOnce({ status: "open", url: "http://pay/existing", id: "sess_old" });
    const r = await pedidoService.crearSesionPago("p1", "u1");
    expect(r.checkoutUrl).toBe("http://pay/existing");
    expect(r.stripeSessionId).toBe("sess_old");
  });

  it("creates new session when no existing session", async () => {
    const save = mock(async () => ({}));
    state.findByIdResult = {
      _id: "p1", clerkUserId: "u1", estado: "PENDIENTE",
      items: [{ pastelId: "past1", nombre: "Torta", precioSnapshot: 50, cantidad: 2 }],
      email: "a@b.com", save,
    };
    stripeCheckoutCreate.mockResolvedValueOnce({ id: "sess_new", url: "http://pay/new" });
    const r = await pedidoService.crearSesionPago("p1", "u1");
    expect(r.checkoutUrl).toBe("http://pay/new");
    expect(r.stripeSessionId).toBe("sess_new");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("creates new session when retrieve fails", async () => {
    const save = mock(async () => ({}));
    state.findByIdResult = {
      _id: "p1", clerkUserId: "u1", estado: "PENDIENTE",
      stripeSessionId: "sess_old",
      items: [{ pastelId: "past1", nombre: "Torta", precioSnapshot: 50, cantidad: 1 }],
      email: "a@b.com", save,
    };
    stripeCheckoutRetrieve.mockRejectedValueOnce(new Error("session expired"));
    stripeCheckoutCreate.mockResolvedValueOnce({ id: "sess_new2", url: "http://pay/new2" });
    const r = await pedidoService.crearSesionPago("p1", "u1");
    expect(r.checkoutUrl).toBe("http://pay/new2");
    expect(r.stripeSessionId).toBe("sess_new2");
    expect(save).toHaveBeenCalledTimes(1);
  });
});
