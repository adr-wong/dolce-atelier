import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { modelsMock, modelState, clerkClientMock, userAuthHeader } from "./helpers";

mock.module("../models", () => modelsMock);
mock.module("../lib/clerk", () => ({ clerkClient: clerkClientMock }));

const { perfilRoutes } = await import("../routes/perfil");

describe("perfilRoutes", () => {
  const app = new Elysia().use(perfilRoutes);
  const BASE = "http://localhost/api/perfil";

  it("PUT / requires auth", async () => {
    const res = await app.handle(
      new Request(`${BASE}/`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(401);
  });

  it("PUT / updates profile", async () => {
    const res = await app.handle(
      new Request(BASE, {
        method: "PUT",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "A", lastName: "B" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(clerkClientMock.clerkUpdateUser).toHaveBeenCalledWith("u1", { firstName: "A", lastName: "B" });
  });

  it("GET /direcciones returns unique addresses", async () => {
    modelState.findResult = [
      { direccionEnvio: "Calle 1", createdAt: 1 },
      { direccionEnvio: "Calle 1", createdAt: 2 },
      { direccionEnvio: "Calle 2", createdAt: 3 },
    ];
    const res = await app.handle(new Request(`${BASE}/direcciones`, { headers: userAuthHeader() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.direcciones).toHaveLength(2);
  });

  it("GET /direcciones requires auth", async () => {
    const res = await app.handle(new Request(`${BASE}/direcciones`));
    expect(res.status).toBe(401);
  });

  it("POST /cambiar-password updates password", async () => {
    clerkClientMock.clerkGetUser.mockResolvedValueOnce({ passwordEnabled: true });
    const res = await app.handle(
      new Request(`${BASE}/cambiar-password`, {
        method: "POST",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "x", newPassword: "newpass123" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("POST /cambiar-password 400 when no password (SSO)", async () => {
    clerkClientMock.clerkGetUser.mockResolvedValueOnce({ passwordEnabled: false });
    const res = await app.handle(
      new Request(`${BASE}/cambiar-password`, {
        method: "POST",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "x", newPassword: "newpass123" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST /cambiar-password 400 on clerk error", async () => {
    clerkClientMock.clerkGetUser.mockRejectedValueOnce(new Error("boom"));
    const res = await app.handle(
      new Request(`${BASE}/cambiar-password`, {
        method: "POST",
        headers: { ...userAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "x", newPassword: "newpass123" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST /cerrar-sesiones revokes all", async () => {
    const res = await app.handle(
      new Request(`${BASE}/cerrar-sesiones`, { method: "POST", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sesionesCerradas).toBe(2);
    expect(clerkClientMock.clerkSessions.revokeSession).toHaveBeenCalledTimes(2);
  });

  it("POST /cerrar-sesiones 400 on error", async () => {
    clerkClientMock.clerkSessions.getSessionList.mockRejectedValueOnce(new Error("x"));
    const res = await app.handle(
      new Request(`${BASE}/cerrar-sesiones`, { method: "POST", headers: userAuthHeader() }),
    );
    expect(res.status).toBe(400);
  });
});
