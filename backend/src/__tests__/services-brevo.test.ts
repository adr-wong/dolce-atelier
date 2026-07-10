import { describe, it, expect, mock } from "bun:test";

const sendMail = mock(async () => ({ messageId: "m1" }));
mock.module("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

const { enviarEmail, enviarFacturaPedido, enviarNotificacionEstado, enviarRecordatorioPedido } =
  await import("../services/brevo");

describe("brevo service", () => {
  it("enviarEmail returns true on success", async () => {
    const ok = await enviarEmail({ to: "a@b.com", subject: "s", html: "<p>hi</p>" });
    expect(ok).toBe(true);
    expect(sendMail).toHaveBeenCalled();
  });

  it("enviarEmail returns false on error", async () => {
    sendMail.mockRejectedValueOnce(new Error("fail"));
    const ok = await enviarEmail({ to: "a@b.com", subject: "s", html: "<p>hi</p>" });
    expect(ok).toBe(false);
  });

  it("enviarFacturaPedido builds html and sends", async () => {
    const ok = await enviarFacturaPedido({
      email: "a@b.com",
      nombre: "Ana",
      pedidoId: "p1",
      total: 100,
      items: [{ nombre: "Torta", cantidad: 2, precioSnapshot: 50 }],
      metodoEntrega: "DOMICILIO",
      direccionEnvio: "Calle",
    });
    expect(ok).toBe(true);
    const html = sendMail.mock.calls[sendMail.mock.calls.length - 1][0].html;
    expect(html).toContain("Ana");
    expect(html).toContain("Torta");
  });

  it("enviarNotificacionEstado maps labels", async () => {
    const ok = await enviarNotificacionEstado({ email: "a@b.com", nombre: "A", pedidoId: "p1", estado: "PAGADO", total: 50 });
    expect(ok).toBe(true);
  });

  it("enviarRecordatorioPedido builds html", async () => {
    const ok = await enviarRecordatorioPedido({ email: "a@b.com", pedidoId: "p1", estado: "PENDIENTE", dias: 3 });
    expect(ok).toBe(true);
  });
});
