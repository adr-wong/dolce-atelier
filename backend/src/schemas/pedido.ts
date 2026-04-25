import { z } from 'zod';

export const CrearPedidoSchema = z.object({
  items: z.array(z.object({
    pastelId: z.string(),
    cantidad: z.number().int().positive(),
  })),
  metodoEntrega: z.enum(['DOMICILIO', 'TIENDA']),
  direccionEnvio: z.string().optional(),
  telefono: z.string().optional(),
});

export const ActualizarEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO']),
});

export const FiltroPedidosSchema = z.object({
  estado: z.string().optional(),
  limit: z.string().optional(),
});