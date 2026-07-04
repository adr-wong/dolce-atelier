import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

interface EnviarEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function enviarEmail({ to, subject, html, replyTo }: EnviarEmailParams): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: process.env.BREVO_FROM_EMAIL || 'Dolce Atelier <noreply@dolceatelier.com>',
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
    });

    console.log('[BREVO] Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('[BREVO] Error enviando email:', error);
    return false;
  }
}

export async function enviarFacturaPedido(params: {
  email: string;
  nombre: string;
  pedidoId: string;
  total: number;
  items: Array<{
    nombre: string;
    cantidad: number;
    precioSnapshot: number;
  }>;
  metodoEntrega: string;
  direccionEnvio?: string;
}): Promise<boolean> {
  console.log('\n========== ENVIANDO FACTURA (BREVO) ==========');
  console.log('Para:', params.email);
  console.log('Pedido ID:', params.pedidoId);

  const itemsHtml = params.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.nombre}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.precioSnapshot.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.precioSnapshot * item.cantidad).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e11d48; margin: 0;">DOLCE ATELIER</h1>
        <p style="color: #666; margin: 5px 0;">Pasteles Artesanales</p>
      </div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; color: #333;">¡Gracias por tu compra, ${params.nombre}!</h2>
        <p style="margin: 0; color: #666;">Tu pedido ha sido confirmado y está siendo preparado.</p>
      </div>

      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cantidad</th>
              <th style="padding: 10px; text-align: right;">Precio</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin: 5px 0;"><strong>Número de pedido:</strong> #${params.pedidoId}</p>
        <p style="margin: 5px 0;"><strong>Método de entrega:</strong> ${params.metodoEntrega === 'DOMICILIO' ? 'Envío a domicilio' : 'Retiro en tienda'}</p>
        ${params.metodoEntrega === 'DOMICILIO' && params.direccionEnvio ? `<p style="margin: 5px 0;"><strong>Dirección:</strong> ${params.direccionEnvio}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Total pagado:</strong> <span style="color: #10b981; font-size: 1.2em;">$${params.total.toFixed(2)}</span></p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">¿Preguntas sobre tu pedido?</p>
        <p style="color: #e11d48; font-size: 14px;">contacto@dolceatelier.com</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #999; font-size: 12px;">Dolce Atelier © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  const result = await enviarEmail({
    to: params.email,
    subject: `Factura - Pedido #${params.pedidoId} - Dolce Atelier`,
    html,
  });

  if (result) {
    console.log('✅ FACTURA ENVIADA EXITOSAMENTE');
  } else {
    console.log('❌ ERROR AL ENVIAR FACTURA');
  }
  console.log('==========================================\n');

  return result;
}

// HU-021: Notificación de cambio de estado por email
export async function enviarNotificacionEstado(params: {
  email: string;
  nombre: string;
  pedidoId: string;
  estado: string;
  total: number;
}): Promise<boolean> {
  const estadoLabels: Record<string, string> = {
    PAGADO: 'Confirmado',
    PREPARANDO: 'En preparación',
    LISTO: 'Listo para entrega',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
  };

  const label = estadoLabels[params.estado] || params.estado;
  const shortId = params.pedidoId.slice(-6).toUpperCase();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #c41e3a;">Dolce Atelier</h2>
      <p>Hola ${params.nombre},</p>
      <p>Tu pedido <strong>#${shortId}</strong> ha cambiado de estado:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
        <span style="font-size: 1.2em; font-weight: bold; color: #c41e3a;">${label}</span>
      </div>
      <p>Total: <strong>$${params.total.toFixed(2)}</strong></p>
      <p style="color: #666; font-size: 14px; margin-top: 20px;">Gracias por confiar en Dolce Atelier</p>
    </div>
  `;

  return enviarEmail({
    to: params.email,
    subject: `Tu pedido #${shortId} está ${label} - Dolce Atelier`,
    html,
  });
}

// HU-041: Email recordatorio pedido estancado
export async function enviarRecordatorioPedido(params: {
  email: string;
  pedidoId: string;
  estado: string;
  dias: number;
}): Promise<boolean> {
  const shortId = params.pedidoId.slice(-6).toUpperCase();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #c41e3a;">Dolce Atelier</h2>
      <p>Hola,</p>
      <p>Notamos que tu pedido <strong>#${shortId}</strong> lleva <strong>${params.dias} días</strong> en estado "${params.estado}".</p>
      <p>Si tenés alguna pregunta, no dudes en contactarnos.</p>
      <p style="color: #666; font-size: 14px;">Dolce Atelier</p>
    </div>
  `;

  return enviarEmail({
    to: params.email,
    subject: `Recordatorio: Pedido #${shortId} - Dolce Atelier`,
    html,
  });
}
