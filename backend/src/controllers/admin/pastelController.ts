import { Pastel } from '../../models';
interface PastelCreateInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
  categoria?: string;
}

export async function listPasteles(context: { set: { status: number }; query: { search?: string; page?: number }; params: Record<string, unknown>; body: Record<string, unknown> }) {
  const { set, query } = context;
  const q: Record<string, unknown> = {};
  const { search } = query;
  if (search) {
    q.$or = [
      { nombre: new RegExp(search, 'i') },
      { descripcion: new RegExp(search, 'i') }
    ];
  }
  const page = query.page || 1;
  const limit = 100;
  const skip = (page - 1) * limit;
  const [pasteles, total] = await Promise.all([
    Pastel.find(q).skip(skip).limit(limit),
    Pastel.countDocuments(q)
  ]);
  set.status = 200;
  return { pasteles, total, page, limit };
}

export async function createPastel(context: { set: { status: number }; query: Record<string, unknown>; params: Record<string, unknown>; body: PastelCreateInput }) {
  const { set, body } = context;
  console.log('[CREATE PASTEL] Body:', JSON.stringify(body));
  const pastelData = {
    nombre: body.nombre,
    descripcion: body.descripcion || '',
    precio: body.precio,
    imagen: body.imagen || '',
    categoria: body.categoria || 'general',
    disponible: true,
  };
  const pastel = await Pastel.create(pastelData);
  const plainPastel = pastel.toObject();
  const result = {
    _id: plainPastel._id.toString(),
    nombre: plainPastel.nombre,
    descripcion: plainPastel.descripcion,
    precio: plainPastel.precio,
    imagen: plainPastel.imagen,
    categoria: plainPastel.categoria,
    disponible: plainPastel.disponible,
    createdAt: plainPastel.createdAt?.toISOString(),
    updatedAt: plainPastel.updatedAt?.toISOString(),
  };
  console.log('[CREATE PASTEL] Result:', JSON.stringify(result));
  set.status = 201;
  return result;
}

export async function updatePastel(context: { set: { status: number }; query: Record<string, unknown>; params: { id?: string }; body: Partial<PastelCreateInput> }) {
  const { set, params, body } = context;
  const pastel = await Pastel.findByIdAndUpdate(
    params.id,
    { $set: { ...body, updatedAt: new Date() } },
    { new: true }
  );
  if (!pastel) {
    set.status = 404;
    return { error: 'Pastel no encontrado' };
  }
  set.status = 200;
  return pastel;
}

import { extraerPublicId, eliminarImagen } from '../../services/cloudinary';

export async function deletePastel(context: { set: { status: number }; query: Record<string, unknown>; params: { id?: string }; body: Record<string, unknown> }) {
  const { set, params } = context;
  const pastel = await Pastel.findById(params.id);
  
  if (!pastel) {
    set.status = 404;
    return { error: 'Pastel no encontrado' };
  }

  if (pastel.imagen) {
    const publicId = extraerPublicId(pastel.imagen);
    if (publicId) {
      try {
        await eliminarImagen(publicId);
        console.log('[DELETE PASTEL] Imagen eliminada de Cloudinary:', publicId);
      } catch (error) {
        console.error('[DELETE PASTEL] Error eliminando imagen:', error);
      }
    }
  }

  await Pastel.findByIdAndDelete(params.id);
  set.status = 200;
  return { success: true };
}