import { describe, it, expect } from "bun:test";

// NOTE: importing this service loads 'whatsapp-web.js' (heavy) but does NOT
// launch a client (that only happens in initWhatsApp). We cover the pure /
// non-network branches: status getters and the "client not ready" guard.
const { getStatus, getQrCode, enviarMensaje } = await import("../services/whatsapp");

describe("whatsapp service", () => {
  it("getStatus reports disconnected initially", () => {
    const s = getStatus();
    expect(s.connected).toBe(false);
    expect(s.hasQr).toBe(false);
  });

  it("getQrCode is null initially", () => {
    expect(getQrCode()).toBeNull();
  });

  it("enviarMensaje returns false when client not ready", async () => {
    const ok = await enviarMensaje("5212345678", "hola");
    expect(ok).toBe(false);
  });
});
