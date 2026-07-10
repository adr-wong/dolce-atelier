import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { mockModels, newModelState } from "./helpers";

const { state, models } = mockModels();
// descuentos.ts imports CodigoDescuento from '../models' and AppError from '../lib/errors'
mock.module("../models", () => models);

const { descuentoRoutes } = await import("../routes/descuentos");

describe("descuentoRoutes", () => {
  const app = new Elysia().use(descuentoRoutes);

  function makeDescuento(overrides: any = {}) {
    return {
      codigo: "PROMO10",
      tipo: "porcentaje",
      valor: 10,
      activo: true,
      fechaExpiracion: new Date(Date.now() + 86_400_000),
      usosMaximos: 0,
      usosActuales: 0,
      minimoCompra: 0,
      ...overrides,
    };
  }

  it("returns 404 when code not found", async () => {
    state.findOneResult = null;
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "NOPE", subtotal: 100 }),
      }),
    );
    // AppError(NOT_FOUND) maps to HTTP 404.
    expect(res.status).toBe(404);
    expect((await res.text()).toLowerCase()).toContain("no válido");
  });

  it("returns 400 when expired", async () => {
    state.findOneResult = makeDescuento({
      fechaExpiracion: new Date(Date.now() - 86_400_000),
    });
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "PROMO10", subtotal: 100 }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.text()).toLowerCase()).toContain("expirado");
  });

  it("returns 400 when usos máximos reached", async () => {
    state.findOneResult = makeDescuento({ usosMaximos: 5, usosActuales: 5 });
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "PROMO10", subtotal: 100 }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.text()).toLowerCase()).toContain("límite");
  });

  it("returns 400 when below minimum purchase", async () => {
    state.findOneResult = makeDescuento({ minimoCompra: 200 });
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "PROMO10", subtotal: 100 }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.text()).toLowerCase()).toContain("mínima");
  });

  it("calculates percentage discount", async () => {
    state.findOneResult = makeDescuento({ tipo: "porcentaje", valor: 10 });
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "promo10", subtotal: 100 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valido).toBe(true);
    expect(body.montoDescuento).toBe(10);
    expect(body.totalConDescuento).toBe(90);
  });

  it("calculates fixed discount capped at subtotal", async () => {
    state.findOneResult = makeDescuento({
      tipo: "fijo",
      valor: 150,
    });
    const res = await app.handle(
      new Request("http://localhost/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: "PROMO10", subtotal: 100 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.montoDescuento).toBe(100);
    expect(body.totalConDescuento).toBe(0);
  });
});
