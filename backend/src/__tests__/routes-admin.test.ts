process.env.NODE_ENV = "development";

import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { modelsMock, servicesMock, adminAuthHeader } from "./helpers";

const dashboard = mock(async () => ({ dashboard: true }));
const listPasteles = mock(async () => ({ pasteles: [1] }));
const createPastel = mock(async () => ({ created: true }));
const updatePastel = mock(async () => ({ updated: true }));
const deletePastel = mock(async () => ({ deleted: true }));
const listPedidos = mock(async () => ({ pedidos: [1] }));
const updatePedidoStatus = mock(async () => ({ status: "PAGADO" }));
const listRecetas = mock(async () => ({ recetas: [1] }));
const createReceta = mock(async () => ({ receta: "new" }));
const updateReceta = mock(async () => ({ receta: "upd" }));
const deleteReceta = mock(async () => ({ receta: "del" }));

mock.module("../controllers/admin/dashboardController", () => ({ getDashboardStats: dashboard }));
mock.module("../controllers/admin/pastelController", () => ({
  listPasteles, createPastel, updatePastel, deletePastel,
}));
mock.module("../controllers/admin/pedidoController", () => ({
  listPedidos, updatePedidoStatus,
}));
mock.module("../controllers/admin/recetaController", () => ({
  listRecetas, createReceta, updateReceta, deleteReceta,
}));

const Categoria = {
  find: () => ({ sort: () => Promise.resolve([{ _id: "c1" }]) }),
  create: async () => ({ _id: "c2", nombre: "N" }),
  findByIdAndUpdate: async () => ({ _id: "c1", nombre: "N2" }),
  findByIdAndDelete: async () => ({}),
};
mock.module("../models/Categoria", () => ({ Categoria }));
mock.module("../models", () => modelsMock);
mock.module("../services", () => servicesMock);

const { adminRoutes } = await import("../routes/admin");

describe("adminRoutes", () => {
  const app = new Elysia().use(adminRoutes);
  const BASE = "http://localhost/api/admin";

  it("GET /stats aggregates services", async () => {
    servicesMock.pedidoService.contarPedidosHoy.mockResolvedValueOnce(5);
    servicesMock.pedidoService.calcularIngresosMes.mockResolvedValueOnce(1234);
    servicesMock.recetaService.contarPendientes.mockResolvedValueOnce(3);
    servicesMock.pastelService.listar.mockResolvedValueOnce([{ _id: "p1" }, { _id: "p2" }, { _id: "p3" }]);
    const res = await app.handle(new Request(`${BASE}/stats`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.pedidosHoy).toBe(5);
    expect(body.stats.recetasPendientes).toBe(3);
    expect(body.stats.productos).toBe(3);
    expect(body.stats.ingresosMes).toBe(1234);
  });

  it("GET /dashboard", async () => {
    const res = await app.handle(new Request(`${BASE}/dashboard`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).dashboard).toBe(true);
  });

  it("GET /pasteles", async () => {
    const res = await app.handle(new Request(`${BASE}/pasteles`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).pasteles).toEqual([1]);
  });

  it("POST /pasteles", async () => {
    const res = await app.handle(
      new Request(`${BASE}/pasteles`, {
        method: "POST",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "T", precio: 10, descripcion: "d", imagen: "i", categoria: "c" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(true);
  });

  it("PUT /pasteles/:id", async () => {
    const res = await app.handle(
      new Request(`${BASE}/pasteles/p1`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).updated).toBe(true);
  });

  it("DELETE /pasteles/:id", async () => {
    const res = await app.handle(
      new Request(`${BASE}/pasteles/p1`, { method: "DELETE", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
  });

  it("GET /pedidos", async () => {
    const res = await app.handle(new Request(`${BASE}/pedidos`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).pedidos).toEqual([1]);
  });

  it("PUT /pedidos/:id/status", async () => {
    const res = await app.handle(
      new Request(`${BASE}/pedidos/p1/status`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAGADO" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("PAGADO");
  });

  it("GET /recetas", async () => {
    const res = await app.handle(new Request(`${BASE}/recetas`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).recetas).toEqual([1]);
  });

  it("POST /recetas", async () => {
    const res = await app.handle(
      new Request(`${BASE}/recetas`, {
        method: "POST",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ nota: "x", personas: 1 }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).receta).toBe("new");
  });

  it("PUT /recetas/:id", async () => {
    const res = await app.handle(
      new Request(`${BASE}/recetas/p1`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).receta).toBe("upd");
  });

  it("DELETE /recetas/:id", async () => {
    const res = await app.handle(
      new Request(`${BASE}/recetas/p1`, { method: "DELETE", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).receta).toBe("del");
  });

  it("GET /categorias", async () => {
    const res = await app.handle(new Request(`${BASE}/categorias`, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json())[0]._id).toBe("c1");
  });

  it("POST /categorias", async () => {
    const res = await app.handle(
      new Request(`${BASE}/categorias`, {
        method: "POST",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "N", slug: "n" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).categoria.nombre).toBe("N");
  });

  it("PUT /categorias/:id", async () => {
    const res = await app.handle(
      new Request(`${BASE}/categorias/c1`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "N2" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).categoria.nombre).toBe("N2");
  });

  it("DELETE /categorias/:id 404 when missing", async () => {
    Categoria.findByIdAndUpdate = async () => null;
    const res = await app.handle(
      new Request(`${BASE}/categorias/c1`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /categorias/:id", async () => {
    Categoria.findByIdAndUpdate = async () => ({ _id: "c1", nombre: "N2" });
    const res = await app.handle(
      new Request(`${BASE}/categorias/c1`, { method: "DELETE", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
