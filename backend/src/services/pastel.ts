import { Pastel } from '../models';
import type { IPastel } from '../models/Pastel';
import { CrearPastelSchema, ActualizarPastelSchema } from '../schemas/pastel';

export class PastelService {
  async listar(categoria?: string, page: number = 1, limit: number = 12): Promise<{ pasteles: IPastel[]; total: number; page: number; totalPages: number }> {
    const filtro = categoria ? { categoria } : {};
    const skip = (page - 1) * limit;
    const [pasteles, total] = await Promise.all([
      Pastel.find(filtro).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Pastel.countDocuments(filtro)
    ]);
    return {
      pasteles,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async obtener(id: string): Promise<IPastel | null> {
    return Pastel.findById(id);
  }

  async crear(data: unknown): Promise<IPastel> {
    const validado = CrearPastelSchema.parse(data);
    return Pastel.create(validado);
  }

  async actualizar(id: string, data: unknown): Promise<IPastel | null> {
    const validado = ActualizarPastelSchema.parse(data);
    return Pastel.findByIdAndUpdate(id, validado, { new: true });
  }

  async eliminar(id: string): Promise<boolean> {
    const resultado = await Pastel.findByIdAndDelete(id);
    return resultado !== null;
  }
}

export const pastelService = new PastelService();