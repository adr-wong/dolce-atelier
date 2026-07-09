import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { modelsMock, modelState, adminAuthHeader } from "./helpers";

mock.module("../models", () => modelsMock);

const { auditoriaRoutes } = await import("../routes/auditoria");

describe("auditoriaRoutes", () => {
  const app = new Elysia().use(auditoriaRoutes);
  const BASE = "http://localhost/api/admin/auditoria";

  it("GET / lists logs (no filters)", async () => {
    modelState.findResult = [{ _id: "1" }];
    const res = await app.handle(new Request(BASE, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).logs).toHaveLength(1);
  });

  it("GET / builds filters from query", async () => {
    modelState.findResult = [{ _id: "2" }];
    const res = await app.handle(
      new Request(
        `${BASE}?userId=u1&accion=LOGIN&recurso=pedido&desde=2024-01-01&hasta=2024-12-31&limite=10`,
        { headers: adminAuthHeader() },
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).logs).toHaveLength(1);
  });

  it("POST /pedidos/:id/foto returns 404 when missing", async () => {
    modelState.findByIdAndUpdateResult = null;
    const res = await app.handle(
      new Request(`${BASE}/pedidos/p1/foto`, {
        method: "POST",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ imagenUrl: "http://img/1" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("POST /pedidos/:id/foto success", async () => {
    modelState.findByIdAndUpdateResult = { _id: "p1", metadata: { fotoPastel: "http://img/1" } };
    const res = await app.handle(
      new Request(`${BASE}/pedidos/p1/foto`, {
        method: "POST",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ imagenUrl: "http://img/1" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
