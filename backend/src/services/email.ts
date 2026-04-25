import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@dolceatelier.com';

interface EnviarEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function enviarEmail({ to, subject, html }: EnviarEmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

export async function enviarConfirmacionPedido(params: {
  email: string;
  nombre: string;
  pedidoId: string;
  total: number;
  estado: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e11d48;">¡Gracias por tu pedido, ${params.nombre}!</h1>
      <p>Tu pedido <strong>#${params.pedidoId}</strong> ha sido recibido.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Estado:</strong> ${params.estado}</p>
        <p><strong>Total:</strong> $${params.total.toFixed(2)}</p>
      </div>
      <p>Te notificaremos cuando tu pedido cambie de estado.</p>
      <p style="color: #666;">Dolce Atelier - Pasteles Artesanales</p>
    </div>
  `;

  return enviarEmail({
    to: params.email,
    subject: `Confirmación de pedido #${params.pedidoId} - Dolce Atelier`,
    html,
  });
}

export async function enviarCotizacionReceta(params: {
  email: string;
  nombre: string;
  recetaId: string;
  cotizacion: number;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e11d48;">Tu cotización está lista</h1>
      <p>Hola ${params.nombre},</p>
      <p>Hemos revisado tu receta personalizada y tenemos una cotización para ti.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="font-size: 24px; font-weight: bold; color: #10b981;">$${params.cotizacion.toFixed(2)}</p>
      </div>
      <p>Ingresa a tu cuenta para aceptar la cotización y proceder al pago.</p>
      <p style="color: #666;">Dolce Atelier - Pasteles Artesanales</p>
    </div>
  `;

  return enviarEmail({
    to: params.email,
    subject: `Cotización de receta #${params.recetaId} - Dolce Atelier`,
    html,
  });
}

export async function enviarEstadoPedido(params: {
  email: string;
  nombre: string;
  pedidoId: string;
  estado: string;
}): Promise<boolean> {
  const estados: Record<string, string> = {
    PAGADO: 'Tu pago ha sido confirmado',
    PREPARANDO: 'Estamos preparando tu pedido',
    LISTO: 'Tu pedido está listo para entrega',
    EN_CAMINO: 'Tu pedido está en camino',
    ENTREGADO: '¡Tu pedido ha sido entregado!',
    CANCELADO: 'Tu pedido ha sido cancelado',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e11d48;">Actualización de pedido #${params.pedidoId}</h1>
      <p>Hola ${params.nombre},</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px;">${estados[params.estado] || params.estado}</p>
      </div>
      <p>¿Preguntas? Contáctanos.</p>
      <p style="color: #666;">Dolce Atelier - Pasteles Artesanales</p>
    </div>
  `;

  return enviarEmail({
    to: params.email,
    subject: `Pedido #${params.pedidoId} - ${estados[params.estado] || params.estado}`,
    html,
  });
}