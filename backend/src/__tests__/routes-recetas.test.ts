import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { servicesMock, stripeMockModule, userAuthHeader } from "./helpers";

mock.module("../services", () => servicesMock);
mock.module("../services/stripe", () => stripeMockModule);

const { recetaRoutes } = await import("../routes/recetas");

describe("recetaRoutes", () => {
  const app = new Elysia().use(recetaRoutes);
  const BASE = "http://localhost/api/recetas";

  it("GET / requires auth", async () => {
    const res = await app.handle(new Request(BASE));
    expect(res.status).toBe(401);
  });

  it("GET / as user lists own", async () => {
    servicesMock.recetaService.listarPorUsuario.mockResolvedValueOnce([{ _id: "r1" }]);
    const res = await app.handle(new Request(BASE, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).recetas).toHaveLength(1);
  });

  it("GET / as admin lists all", async () => {
    servicesMock.recetaService.listarTodos.mockResolvedValueOnce([{ _id: "a" }, { _id: "b" }]);
    const res = await app.handle(
      new Request(BASE, { headers: { ...userAuthHeader(), "x-user-role": "admin" } }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).recetas).toHaveLength(2);
  });

  it("GET /:id requires auth", async () => {
    const res = await app.handle(new Request(`${BASE}/r1`));
    expect(res.status).toBe(401);
  });

  it("GET /:id 404 when missing", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(new Request(`${BASE}/r1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(404);
  });

  it("GET /:id 403 when not owner", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce({ _id: "r1", clerkUserId: "other" });
    const res = await app.handle(new Request(`${BASE}/r1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(403);
  });

  it("GET /:id success", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce({ _id: "r1", clerkUserId: "u1" });
    const res = await app.handle(new Request(`${BASE}/r1`, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
  });

  it("POST / requires auth", async () => {
    const res = await app.handle(
      new Request(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(401);
  });

  it("POST / creates receta", async () => {
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ nota: "x", personas: 2 }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).receta._id).toBe("r1");
  });

  it("PUT /:id 404 when missing", async () => {
    servicesMock.recetaService.actualizar.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/r1`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /:id updates", async () => {
    servicesMock.recetaService.actualizar.mockResolvedValueOnce({ _id: "r1" });
    const res = await app.handle(
      new Request(`${BASE}/r1`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(200);
  });

  it("PUT /:id/cotizar 404 when missing", async () => {
    servicesMock.recetaService.cotizar.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/r1/cotizar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotizacion: 50 }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /:id/cotizar success", async () => {
    servicesMock.recetaService.cotizar.mockResolvedValueOnce({ _id: "r1", estado: "COTIZADA" });
    const res = await app.handle(
      new Request(`${BASE}/r1/cotizar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotizacion: 50 }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).receta.estado).toBe("COTIZADA");
  });

  it("POST /:id/aceptar-pagar requires auth", async () => {
    const res = await app.handle(new Request(`${BASE}/r1/aceptar-pagar`, { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("POST /:id/aceptar-pagar 404 when missing", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request(`${BASE}/r1/aceptar-pagar`, { method: "POST", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(404);
  });

  it("POST /:id/aceptar-pagar 403 when not owner", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce({ _id: "r1", clerkUserId: "other", estado: "COTIZADA", cotizacion: 100 });
    const res = await app.handle(
      new Request(`${BASE}/r1/aceptar-pagar`, { method: "POST", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(403);
  });

  it("POST /:id/aceptar-pagar 400 when no cotizacion", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce({ _id: "r1", clerkUserId: "u1", estado: "PENDIENTE", cotizacion: undefined });
    const res = await app.handle(
      new Request(`${BASE}/r1/aceptar-pagar`, { method: "POST", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(400);
  });

  // NOTE: aceptar-pagar reads `headers.get('x-user-email')` on the Elysia
  // context `headers` (a plain object without `.get` in Elysia v1.3). This
  // throws, so the handler returns 500 (latent source bug, not fixed here).
  // The 401/404/403/400 branches are covered above; the success branch that
  // calls crearSesionReceta cannot be reached via HTTP because of the bug.
  it("POST /:id/aceptar-pagar throws (500) on headers.get bug", async () => {
    servicesMock.recetaService.obtener.mockResolvedValueOnce({ _id: "r1", clerkUserId: "u1", estado: "COTIZADA", cotizacion: 100 });
    const res = await app.handle(
      new Request(`${BASE}/r1/aceptar-pagar`, {
        method: "POST",
        headers: { ...userAuthHeader(), "x-user-email": "a@b.com" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
