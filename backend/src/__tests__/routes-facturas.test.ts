import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { modelsMock, modelState, userAuthHeader } from "./helpers";

mock.module("../models", () => modelsMock);

const { facturaRoutes } = await import("../routes/facturas");

function makePedido(overrides: any = {}) {
  return {
    _id: "p1",
    email: "a@b.com",
    metodoEntrega: "DOMICILIO",
    total: 250,
    direccionEnvio: "Calle 123",
    createdAt: new Date("2024-05-01"),
    estado: "PAGADO",
    items: [{ nombre: "Torta", cantidad: 2, precioSnapshot: 100 }],
    ...overrides,
  };
}

describe("facturaRoutes", () => {
  const app = new Elysia().use(facturaRoutes);
  const BASE = "http://localhost/api/facturas";

  it("requires auth (401)", async () => {
    const res = await app.handle(new Request(`${BASE}/p1`));
    expect(res.status).toBe(401);
  });

  it("returns 404 when missing", async () => {
    modelState.findByIdResult = null;
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when not owner", async () => {
    modelState.findByIdResult = makePedido({ clerkUserId: "other" });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when not paid", async () => {
    modelState.findByIdResult = makePedido({ clerkUserId: "u1", estado: "PENDIENTE" });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(400);
  });

  it("returns HTML factura when paid", async () => {
    modelState.findByIdResult = makePedido({ clerkUserId: "u1" });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Factura");
    expect(text).toContain("Torta");
  });

  it("returns factura for TIENDA delivery without address", async () => {
    modelState.findByIdResult = makePedido({
      clerkUserId: "u1",
      metodoEntrega: "TIENDA",
      direccionEnvio: undefined,
    });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Factura");
  });
});
