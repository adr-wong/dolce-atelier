import { enviarMensaje } from './whatsapp';

function formatTelefono(telefono?: string): string | null {
  if (!telefono) return null;
  const cleaned = telefono.replace(/[^0-9+]/g, '');
  if (cleaned.length < 8) return null;
  return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
}

export async function notificarCambioEstado(
  telefono: string | undefined,
  pedidoId: string,
  nuevoEstado: string,
  datosExtra?: { total?: number; metodo?: string; direccion?: string }
): Promise<boolean> {
  const phone = formatTelefono(telefono);
  if (!phone) {
    console.log('[NOTIF] Teléfono no válido, skip notificación');
    return false;
  }

  const shortId = pedidoId.slice(-6).toUpperCase();
  let mensaje = '';

  switch (nuevoEstado) {
    case 'PAGADO':
      mensaje = `🎂 *Dolce Atelier*\n\n`
        + `¡Hola! Tu pedido *#${shortId}* ha sido confirmado.\n`
        + `Total: $${datosExtra?.total?.toFixed(2) || '—'}\n\n`
        + `Te notificaremos cuando esté en preparación.`;
      break;

    case 'PREPARANDO':
      mensaje = `🎂 *Dolce Atelier*\n\n`
        + `Tu pedido *#${shortId}* está siendo preparado con amor. 🍰`;
      break;

    case 'LISTO':
      if (datosExtra?.metodo === 'TIENDA') {
        mensaje = `🎂 *Dolce Atelier*\n\n`
          + `¡Tu pedido *#${shortId}* está listo para recoger! 🎉\n`
          + `Pásalo a buscar en nuestra tienda.`;
      } else {
        mensaje = `🎂 *Dolce Atelier*\n\n`
          + `¡Tu pedido *#${shortId}* está listo y saldrá en breve hacia tu dirección.`;
      }
      break;

    case 'EN_CAMINO':
      mensaje = `🎂 *Dolce Atelier*\n\n`
        + `Tu pedido *#${shortId}* va en camino a:\n`
        + `📍 ${datosExtra?.direccion || 'tu dirección'}\n\n`
        + `¡Prepárate para recibirlo!`;
      break;

    case 'ENTREGADO':
      mensaje = `🎂 *Dolce Atelier*\n\n`
        + `¡Tu pedido *#${shortId}* ha sido entregado! ✅\n`
        + `¡Gracias por elegirnos! Esperamos que disfrutes tu pastel. 🎂`;
      break;

    case 'CANCELADO':
      mensaje = `🎂 *Dolce Atelier*\n\n`
        + `Tu pedido *#${shortId}* ha sido cancelado.\n`
        + `Si tienes preguntas, contáctanos.`;
      break;

    default:
      return false;
  }

  return enviarMensaje(phone, mensaje);
}

export async function notificarCotizacionReceta(
  telefono: string | undefined,
  recetaId: string,
  cotizacion: number
): Promise<boolean> {
  const phone = formatTelefono(telefono);
  if (!phone) return false;

  const shortId = recetaId.slice(-6).toUpperCase();
  const mensaje = `🎂 *Dolce Atelier*\n\n`
    + `¡Hola! Tu solicitud de pastel personalizado *#${shortId}* ha sido cotizada.\n`
    + `💰 Precio: *$${cotizacion.toFixed(2)}*\n\n`
    + `Ingresa a dolceatelier.com/recetas/mis para aceptar o rechazar.`;

  return enviarMensaje(phone, mensaje);
}
