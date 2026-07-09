import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import {
  modelsMock,
  modelState,
  stripeMockModule,
  adminAuthHeader,
} from "./helpers";

mock.module("../models", () => modelsMock);
mock.module("../services/stripe", () => stripeMockModule);

const { dlqRoutes } = await import("../routes/dlq");

describe("dlqRoutes", () => {
  const app = new Elysia().use(dlqRoutes);
  const BASE = "http://localhost/api/admin/dlq";

  it("GET / lists failed events by default", async () => {
    modelState.findResult = [{ _id: "e1" }];
    const res = await app.handle(new Request(BASE, { headers: adminAuthHeader() }));
    expect(res.status).toBe(200);
    expect((await res.json()).eventos).toHaveLength(1);
  });

  it("GET / filters by estado", async () => {
    modelState.findResult = [{ _id: "e2" }];
    const res = await app.handle(
      new Request(`${BASE}?estado=FALLIDO`, { headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).eventos).toHaveLength(1);
  });

  it("POST /:id/reprocesar returns 404 when missing", async () => {
    modelState.findByIdResult = null;
    const res = await app.handle(
      new Request(`${BASE}/e1/reprocesar`, { method: "POST", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(404);
  });

  it("POST /:id/reprocesar processes and updates", async () => {
    const save = mock(async () => ({}));
    modelState.findByIdResult = { _id: "e1", estado: "FALLIDO", reintentos: 0, save };
    const res = await app.handle(
      new Request(`${BASE}/e1/reprocesar`, { method: "POST", headers: adminAuthHeader() }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(stripeMockModule.procesarWebhookStripe).toHaveBeenCalledTimes(1);
  });
});
