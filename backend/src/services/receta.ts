import { Receta } from '../models';
import type { IReceta } from '../models/Receta';
import { ActualizarRecetaSchema } from '../schemas/receta';

export class RecetaService {
  async listarPorUsuario(clerkUserId: string): Promise<IReceta[]> {
    return Receta.find({ clerkUserId }).sort({ createdAt: -1 });
  }

  async listarTodos(estado?: string): Promise<IReceta[]> {
    const filtro = estado ? { estado } : {};
    return Receta.find(filtro).sort({ createdAt: -1 });
  }

  async obtener(id: string): Promise<IReceta | null> {
    return Receta.findById(id);
  }

  async crear(clerkUserId: string, data: { nota: string; personas: number; archivoUrl?: string }): Promise<IReceta> {
    return Receta.create({
      clerkUserId,
      nota: data.nota,
      personas: data.personas,
      archivoUrl: data.archivoUrl,
      estado: 'PENDIENTE',
    });
  }

  async actualizar(id: string, data: unknown): Promise<IReceta | null> {
    const validado = ActualizarRecetaSchema.parse(data);
    return Receta.findByIdAndUpdate(id, validado, { new: true });
  }

  async cotizar(id: string, cotizacion: number): Promise<IReceta | null> {
    return Receta.findByIdAndUpdate(
      id,
      { cotizacion, estado: 'COTIZADA' },
      { new: true }
    );
  }

  async contarPendientes(): Promise<number> {
    return Receta.countDocuments({ estado: 'PENDIENTE' });
  }
}

export const recetaService = new RecetaService();