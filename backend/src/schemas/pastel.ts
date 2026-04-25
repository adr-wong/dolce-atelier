import { z } from 'zod';

export const CrearPastelSchema = z.object({
  nombre: z.string().min(1).max(100),
  precio: z.number().positive(),
  categoria: z.string().min(1),
  imagen: z.string().url(),
  disponible: z.boolean().default(true),
  descripcion: z.string().optional(),
});

export const ActualizarPastelSchema = CrearPastelSchema.partial();

export const FiltroPastelesSchema = z.object({
  categoria: z.string().optional(),
  disponible: z.string().optional(),
});