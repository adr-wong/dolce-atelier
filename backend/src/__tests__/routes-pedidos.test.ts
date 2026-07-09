import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { servicesMock, userAuthHeader, adminAuthHeader } from "./helpers";

mock.module("../services", () => servicesMock);

const { pedidoRoutes } = await import("../routes/pedidos");

describe("pedidoRoutes", () => {
  const app = new Elysia().use(pedidoRoutes);
  const BASE = "http://localhost/api/pedidos";

  it("GET / requires auth (401)", async () => {
    const res = await app.handle(new Request(BASE));
    expect(res.status).toBe(401);
  });

  it("GET / as user lists own pedidos", async () => {
    servicesMock.pedidoService.listarPorUsuario.mockResolvedValueOnce([{ _id: "p1" }]);
    const res = await app.handle(new Request(BASE, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).pedidos).toEqual([{ _id: "p1" }]);
  });

  it("GET / as admin lists all pedidos", async () => {
    servicesMock.pedidoService.listarTodos.mockResolvedValueOnce([{ _id: "a" }, { _id: "b" }]);
    const res = await app.handle(
      new Request(BASE, {
        headers: { ...userAuthHeader(), "x-user-role": "admin" },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).pedidos).toHaveLength(2);
  });

  it("GET /:id requires auth", async () => {
    const res = await app.handle(new Request(`${BASE}/p1`));
    expect(res.status).toBe(401);
  });

  it("GET /:id returns 404 when missing", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(404);
  });

  it("GET /:id returns 403 when not owner", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "other" });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(403);
  });

  it("GET /:id returns pedido for owner", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "u1" });
    const res = await app.handle(new Request(`${BASE}/p1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
  });

  it("POST / requires auth", async () => {
    const res = await app.handle(
      new Request(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(401);
  });

  it("POST / creates pedido and supports idempotency", async () => {
    servicesMock.pedidoService.crear.mockClear();
    const body = JSON.stringify({ email: "a@b.com", items: [] });
    const opt = {
      method: "POST" as const,
      headers: { "Content-Type": "application/json", ...userAuthHeader(), "Idempotency-Key": "ped-k1" },
      body,
    };
    const r1 = await app.handle(new Request(BASE, opt));
    expect(r1.status).toBe(200);
    const r2 = await app.handle(new Request(BASE, opt));
    expect(r2.status).toBe(200);
    expect(servicesMock.pedidoService.crear).toHaveBeenCalledTimes(1);
  });

  it("PUT /:id/estado returns 404 when missing", async () => {
    servicesMock.pedidoService.actualizarEstado.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/p1/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...userAuthHeader() },
        body: JSON.stringify({ estado: "PAGADO" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /:id/estado updates estado", async () => {
    servicesMock.pedidoService.actualizarEstado.mockResolvedValueOnce({ _id: "p1", estado: "PAGADO" });
    const res = await app.handle(
      new Request(`${BASE}/p1/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...userAuthHeader() },
        body: JSON.stringify({ estado: "PAGADO" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).pedido.estado).toBe("PAGADO");
  });

  it("PUT /:id/cancelar returns 401 when unauth", async () => {
    const res = await app.handle(new Request(`${BASE}/p1/cancelar`, { method: "PUT" }));
    expect(res.status).toBe(401);
  });

  it("PUT /:id/cancelar returns 404 when missing", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/p1/cancelar`, { method: "PUT", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /:id/cancelar returns 403 when not owner", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "other" });
    const res = await app.handle(
      new Request(`${BASE}/p1/cancelar`, { method: "PUT", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(403);
  });

  it("PUT /:id/cancelar returns 400 when not PENDIENTE", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "u1", estado: "PAGADO" });
    const res = await app.handle(
      new Request(`${BASE}/p1/cancelar`, { method: "PUT", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT /:id/cancelar succeeds", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "u1", estado: "PENDIENTE" });
    servicesMock.pedidoService.actualizarEstado.mockResolvedValueOnce({ _id: "p1", estado: "CANCELADO" });
    const res = await app.handle(
      new Request(`${BASE}/p1/cancelar`, { method: "PUT", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).pedido.estado).toBe("CANCELADO");
  });

  it("PUT /:id/calificar returns 404 when missing", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/p1/calificar`, {
        method: "PUT",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: 5 }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /:id/calificar returns 403 when not owner", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "other", estado: "ENTREGADO" });
    const res = await app.handle(
      new Request(`${BASE}/p1/calificar`, {
        method: "PUT",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: 5 }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("PUT /:id/calificar returns 400 when not ENTREGADO", async () => {
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "u1", estado: "PENDIENTE" });
    const res = await app.handle(
      new Request(`${BASE}/p1/calificar`, {
        method: "PUT",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: 5 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT /:id/calificar succeeds", async () => {
    const save = mock(async () => ({}));
    servicesMock.pedidoService.obtener.mockResolvedValueOnce({ _id: "p1", clerkUserId: "u1", estado: "ENTREGADO", save });
    const res = await app.handle(
      new Request(`${BASE}/p1/calificar`, {
        method: "PUT",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: 5, resena: "bueno" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
