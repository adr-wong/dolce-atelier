import { Pastel } from '../models';
import type { IPastel } from '../models/Pastel';
import { CrearPastelSchema, ActualizarPastelSchema } from '../schemas/pastel';
import type { FiltroPasteles } from '../schemas/pastel';
import type { FilterQuery, SortOrder } from 'mongoose';

export class PastelService {
  async listar(filtros: FiltroPasteles = {}): Promise<{
    pasteles: IPastel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 12;
    const skip = (page - 1) * limit;

    // Build MongoDB filter
    const filtro: FilterQuery<IPastel> = {};

    // Filtro por categoría
    if (filtros.categoria) {
      filtro.categoria = filtros.categoria;
    }

    // Búsqueda por nombre/descripción (HU-029)
    if (filtros.q) {
      const regex = new RegExp(filtros.q, 'i');
      filtro.$or = [
        { nombre: regex },
        { descripcion: regex },
      ];
    }

    // Filtro por rango de precio (HU-030)
    if (filtros.precioMin !== undefined || filtros.precioMax !== undefined) {
      filtro.precio = {};
      if (filtros.precioMin !== undefined) {
        (filtro.precio as any).$gte = filtros.precioMin;
      }
      if (filtros.precioMax !== undefined) {
        (filtro.precio as any).$lte = filtros.precioMax;
      }
    }

    // Ordenamiento (HU-031)
    const sortField = filtros.ordenarPor || 'createdAt';
    const sortDir: SortOrder = filtros.orden === 'asc' ? 1 : -1;

    const [pasteles, total] = await Promise.all([
      Pastel.find(filtro)
        .skip(skip)
        .limit(limit)
        .sort({ [sortField]: sortDir }),
      Pastel.countDocuments(filtro),
    ]);

    return {
      pasteles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
