import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import {
  modelsMock,
  modelState,
  auditLogMockModule,
  adminAuthHeader,
  userAuthHeader,
} from "./helpers";

mock.module("../models", () => modelsMock);
mock.module("../services/auditLog", () => auditLogMockModule);

const { reembolsoRoutes } = await import("../routes/reembolsos");

describe("reembolsoRoutes", () => {
  const app = new Elysia().use(reembolsoRoutes);
  const BASE = "http://localhost/api/reembolsos";

  it("403 when no admin", async () => {
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: "p1" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("403 when non-admin role", async () => {
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userAuthHeader() },
        body: JSON.stringify({ pedidoId: "p1" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  // NOTE: reembolsos.ts declares a `body` schema AND then calls
  // `request.json()` again inside the handler. Elysia already consumed the
  // request body during schema validation, so `request.json()` throws
  // "Body already used" -> 500. The 403 branches (verifyAdmin) are reachable
  // before body parsing; the pedido/refund/audit logic below cannot be reached
  // via HTTP because of this latent bug. We assert the real 500 behavior.
  it("500 due to double body read (latent bug)", async () => {
    modelState.findByIdResult = { _id: "p1", estado: "PAGADO", stripeSessionId: "sess1" };
    const res = await app.handle(
      new Request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeader() },
        body: JSON.stringify({ pedidoId: "p1" }),
      }),
    );
    expect(res.status).toBe(500);
  });
});
