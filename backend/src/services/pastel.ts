import { Pastel } from '../models';
import type { IPastel } from '../models/Pastel';
import { CrearPastelSchema, ActualizarPastelSchema } from '../schemas/pastel';

export class PastelService {
  async listar(categoria?: string): Promise<IPastel[]> {
    const filtro = categoria ? { categoria } : {};
    return Pastel.find(filtro).sort({ createdAt: -1 });
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