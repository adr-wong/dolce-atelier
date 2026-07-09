import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { authRoutes } from "../routes/auth";

// NOTE: auth.ts reads `headers.get('authorization')` on the Elysia context
// `headers` object, which is a plain object WITHOUT a `.get` method in Elysia
// v1.3. The handler therefore throws and Elysia returns 500. These tests
// assert the REAL current behavior (latent bug in source — not fixed here
// per instructions). Coverage of the handler line is still exercised.
describe("authRoutes", () => {
  const app = new Elysia().use(authRoutes);

  it("throws (500) without Bearer token", async () => {
    const res = await app.handle(new Request("http://localhost/api/auth/token"));
    expect(res.status).toBe(500);
  });

  it("throws (500) with non-Bearer auth", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/token", {
        headers: { authorization: "Basic abc" },
      }),
    );
    expect(res.status).toBe(500);
  });

  it("throws (500) even with a valid Bearer header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/token", {
        headers: { authorization: "Bearer my.jwt.token" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
