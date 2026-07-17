import { describe, it, expect, mock } from "bun:test";
import { modelsMock, modelState, stripeNpmMock } from "./helpers";

mock.module("../models", () => modelsMock);
mock.module("stripe", () => ({ default: stripeNpmMock }));

const { pedidoService } = await import("../services/pedido");
const state = modelState;

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

  it("crear validates and returns pedido+checkout", async () => {
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
    expect(result.pedido._id).toBe("p1");
    expect(result.checkoutUrl).toBe("http://pay/1");
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
