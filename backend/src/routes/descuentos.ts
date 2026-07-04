import { Elysia, t } from 'elysia';
import { CodigoDescuento } from '../models';
import { AppError, ErrorCode } from '../lib/errors';

export const descuentoRoutes = new Elysia({ prefix: '/api/descuentos' })
  .post('/validar', async ({ body, set }) => {
    const { codigo, subtotal } = body as { codigo: string; subtotal: number };

    const descuento = await CodigoDescuento.findOne({
      codigo: codigo.toUpperCase(),
      activo: true,
    });

    if (!descuento) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Código de descuento no válido');
    }

    // Validar expiración
    if (descuento.fechaExpiracion < new Date()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'El código de descuento ha expirado');
    }

    // Validar usos máximos
    if (descuento.usosMaximos > 0 && descuento.usosActuales >= descuento.usosMaximos) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'El código de descuento alcanzó su límite de usos');
    }

    // Validar compra mínima
    if (subtotal < descuento.minimoCompra) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `El código requiere una compra mínima de $${descuento.minimoCompra}`
      );
    }

    // Calcular descuento
    let montoDescuento = 0;
    if (descuento.tipo === 'porcentaje') {
      montoDescuento = Math.round((subtotal * descuento.valor) / 100);
    } else {
      montoDescuento = Math.min(descuento.valor, subtotal);
    }

    return {
      valido: true,
      codigo: descuento.codigo,
      tipo: descuento.tipo,
      valor: descuento.valor,
      montoDescuento,
      totalConDescuento: subtotal - montoDescuento,
    };
  }, {
    body: t.Object({
      codigo: t.String({ minLength: 1 }),
      subtotal: t.Number({ minimum: 0 }),
    }),
  });
