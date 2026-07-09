import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;
let qrCode: string | null = null;

export function initWhatsApp() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    },
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    console.log('[WHATSAPP] Escanea este QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    qrCode = null;
    console.log('[WHATSAPP] ✅ Cliente conectado y listo');
  });

  client.on('authenticated', () => {
    console.log('[WHATSAPP] 🔐 Autenticado exitosamente');
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('[WHATSAPP] ❌ Fallo de autenticación:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    client = null;
    console.log('[WHATSAPP] Desconectado:', reason);
  });

  client.initialize();
}

export function getStatus() {
  return {
    connected: isReady,
    hasQr: qrCode !== null,
  };
}

export async function enviarMensaje(
  numero: string,
  mensaje: string
): Promise<boolean> {
  if (!client || !isReady) {
    console.warn('[WHATSAPP] Cliente no listo, mensaje no enviado');
    return false;
  }

  try {
    const chatId = numero.includes('@c.us')
      ? numero
        : `${numero.replace(/\D/g, '')}@c.us`;

    await client.sendMessage(chatId, mensaje);
    console.log(`[WHATSAPP] ✅ Mensaje enviado a ${numero}`);
    return true;
  } catch (error) {
    console.error(`[WHATSAPP] ❌ Error enviando a ${numero}:`, error);
    return false;
  }
}

export function getQrCode() {
  return qrCode;
}
