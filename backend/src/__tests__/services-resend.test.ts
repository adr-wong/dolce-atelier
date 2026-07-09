import { describe, it, expect, mock } from "bun:test";

const send = mock(async () => ({ data: { id: "r1" }, error: null }));
class ResendMock {
  emails = { send };
}
mock.module("resend", () => ({ Resend: ResendMock }));

const { enviarEmailResend, enviarFacturaPedido } = await import("../services/resend");

describe("resend service", () => {
  it("enviarEmailResend returns true on success", async () => {
    const ok = await enviarEmailResend({ to: "a@b.com", subject: "s", html: "<p>hi</p>" });
    expect(ok).toBe(true);
  });

  it("enviarEmailResend returns false on error", async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: "bad" } });
    const ok = await enviarEmailResend({ to: "a@b.com", subject: "s", html: "<p>hi</p>" });
    expect(ok).toBe(false);
  });

  it("enviarEmailResend returns false on exception", async () => {
    send.mockRejectedValueOnce(new Error("boom"));
    const ok = await enviarEmailResend({ to: "a@b.com", subject: "s", html: "<p>hi</p>" });
    expect(ok).toBe(false);
  });

  it("enviarFacturaPedido builds html and sends", async () => {
    const ok = await enviarFacturaPedido({
      email: "a@b.com",
      nombre: "Ana",
      pedidoId: "p1",
      total: 100,
      items: [{ nombre: "Torta", cantidad: 2, precioSnapshot: 50 }],
      metodoEntrega: "TIENDA",
    });
    expect(ok).toBe(true);
    const html = send.mock.calls[send.mock.calls.length - 1][0].html;
    expect(html).toContain("Ana");
    expect(html).toContain("Torta");
  });
});
