import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { servicesMock } from "./helpers";

// NOTE: pasteles.ts POST/PUT/DELETE use `.guard({ preHandler: authMiddleware })`
// with `body: 'Pastel'` (an unresolved TypeBox schema reference). Compiling those
// routes throws ("schema is not an Object"), so their handlers can't be exercised
// via HTTP. We cover the GET handlers (which work) and note the latent bug.
mock.module("../services", () => servicesMock);

const { pastelRoutes } = await import("../routes/pasteles");

describe("pastelRoutes (GET)", () => {
  const app = new Elysia().use(pastelRoutes);

  it("GET / lists pasteles", async () => {
    const res = await app.handle(new Request("http://localhost/api/pasteles"));
    expect(res.status).toBe(200);
    expect((await res.json()).pasteles).toEqual([]);
  });

  it("GET /:id returns pastel", async () => {
    servicesMock.pastelService.obtener.mockResolvedValueOnce({ _id: "p1", nombre: "Torta" });
    const res = await app.handle(new Request("http://localhost/api/pasteles/p1"));
    expect(res.status).toBe(200);
    expect((await res.json()).nombre).toBe("Torta");
  });

  it("GET /:id returns 404 when not found", async () => {
    servicesMock.pastelService.obtener.mockResolvedValueOnce(null);
    const res = await app.handle(new Request("http://localhost/api/pasteles/missing"));
    expect(res.status).toBe(404);
  });
});
