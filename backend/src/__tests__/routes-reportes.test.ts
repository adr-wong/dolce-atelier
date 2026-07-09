import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { modelsMock, modelState, adminAuthHeader } from "./helpers";

mock.module("../models", () => modelsMock);

const { reportesRoutes } = await import("../routes/reportes");

describe("reportesRoutes", () => {
  const app = new Elysia().use(reportesRoutes);
  const BASE = "http://localhost/api/admin/reportes";

  it("GET /ventas default (mes) aggregates", async () => {
    modelState.aggregateResult = [{ totalVentas: 500, numeroPedidos: 2, ticketPromedio: 250 }];
    const res = await app.handle(new Request(`${BASE}/ventas`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalVentas).toBe(500);
    expect(body.numeroPedidos).toBe(2);
    expect(body.ticketPromedio).toBe(250);
    expect(body.periodo).toBe("mes");
  });

  it("GET /ventas with periodo semana", async () => {
    modelState.aggregateResult = [];
    const res = await app.handle(
      new Request(`${BASE}/ventas?periodo=semana`, { headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).periodo).toBe("semana");
  });

  it("GET /ventas with periodo año", async () => {
    modelState.aggregateResult = [];
    const res = await app.handle(
      new Request(`${BASE}/ventas?periodo=año`, { headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).periodo).toBe("año");
  });

  it("GET /ventas with desde/hasta range", async () => {
    modelState.aggregateResult = [];
    const res = await app.handle(
      new Request(`${BASE}/ventas?desde=2024-01-01&hasta=2024-12-31`, { headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).periodo).toBe("mes");
  });

  it("GET /ventas/csv builds CSV", async () => {
    modelState.findResult = [
      { _id: "p1", email: "a@b.com", estado: "PAGADO", total: 100, metodoEntrega: "TIENDA", createdAt: new Date("2024-05-01") },
    ];
    const res = await app.handle(new Request(`${BASE}/ventas/csv`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("ID,Email,Estado,Total");
    expect(csv).toContain("p1");
  });

  it("GET /mas-vendidos maps aggregation", async () => {
    modelState.aggregateResult = [
      { _id: "Torta", pastelId: "pp1", totalVendido: 5, ingresos: 500 },
    ];
    const res = await app.handle(new Request(`${BASE}/mas-vendidos`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.masVendidos[0].nombre).toBe("Torta");
    expect(body.masVendidos[0].totalVendido).toBe(5);
  });

  it("GET /mas-vendidos with limite query", async () => {
    modelState.aggregateResult = [];
    const res = await app.handle(
      new Request(`${BASE}/mas-vendidos?limite=3`, { headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).masVendidos).toEqual([]);
  });
});
