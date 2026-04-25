import { z } from 'zod';

export const ActualizarRecetaSchema = z.object({
  estado: z.enum(['PENDIENTE', 'REVISANDO', 'COTIZADA', 'ACEPTADA', 'RECHAZADA']).optional(),
  cotizacion: z.number().positive().optional(),
});

export const CotizarRecetaSchema = z.object({
  cotizacion: z.number().positive(),
});

export const FiltroRecetasSchema = z.object({
  estado: z.string().optional(),
});