import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { clerkClientMock, adminAuthHeader } from "./helpers";

mock.module("../lib/clerk", () => ({ clerkClient: clerkClientMock }));

const { usuarioRoutes } = await import("../routes/usuarios");

describe("usuarioRoutes", () => {
  const app = new Elysia().use(usuarioRoutes);
  const BASE = "http://localhost/api/admin/usuarios";

  it("GET / lists users with role mapping", async () => {
    const res = await app.handle(new Request(BASE, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.usuarios[0].role).toBe("admin");
    expect(data.usuarios[0].email).toBe("a@b.com");
  });

  it("PUT /:id/rol updates metadata", async () => {
    const res = await app.handle(
      new Request(`${BASE}/u1/rol`, {
        method: "PUT",
        headers: { ...adminAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ role: "superadmin" }),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe("superadmin");
    expect(clerkClientMock.clerkUpdateUserMetadata).toHaveBeenCalledWith("u1", {
      publicMetadata: { role: "superadmin" },
    });
  });

  it("POST /:id/impersonar returns token", async () => {
    const res = await app.handle(
      new Request(`${BASE}/u1/impersonar`, { method: "POST", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe("sess-token");
  });

  it("POST /:id/impersonar 400 on clerk error", async () => {
    clerkClientMock.clerkCreateSessionToken.mockRejectedValueOnce(new Error("no"));
    const res = await app.handle(
      new Request(`${BASE}/u1/impersonar`, { method: "POST", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(400);
  });
});
