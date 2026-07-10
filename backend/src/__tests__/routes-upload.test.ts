import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { servicesMock, adminAuthHeader } from "./helpers";

mock.module("../services", () => servicesMock);

const { uploadRoutes } = await import("../routes/upload");

function fd(field: string, name: string, data: Uint8Array) {
  const f = new FormData();
  f.set(field, new File([data], name, { type: "application/octet-stream" }));
  return f;
}

describe("uploadRoutes", () => {
  const app = new Elysia().use(uploadRoutes);
  const BASE = "http://localhost/api/upload";

  it("POST / 400 when no file", async () => {
    const res = await app.handle(
      new Request(BASE, { method: "POST", headers: adminAuthHeader(), body: new FormData() }),
    );
    expect(res.status).toBe(400);
  });

  it("POST / uploads image", async () => {
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: adminAuthHeader(),
        body: fd("file", "f.png", new Uint8Array([1, 2, 3])),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("http://img/1");
  });

  it("POST / 500 on upload error", async () => {
    servicesMock.subirImagen.mockRejectedValueOnce(new Error("up"));
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: adminAuthHeader(),
        body: fd("file", "f.png", new Uint8Array([1, 2, 3])),
      }),
    );
    expect(res.status).toBe(500);
  });

  it("POST /receta 400 when no file", async () => {
    const res = await app.handle(
      new Request(`${BASE}/receta`, { method: "POST", headers: adminAuthHeader(), body: new FormData() }),
    );
    expect(res.status).toBe(400);
  });

  it("POST /receta uploads receta", async () => {
    const res = await app.handle(
      new Request(`${BASE}/receta`, {
        method: "POST",
        headers: adminAuthHeader(),
        body: fd("archivo", "r.pdf", new Uint8Array([9, 9])),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("http://rec/1");
  });
});
