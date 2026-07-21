import { Receta } from '../../models';

type ElysiaContext = {
  set: { status: number };
  query: Record<string, unknown>;
  params: { id?: string };
  body: unknown;
};

export async function listRecetas(context: ElysiaContext) {
  const { set } = context;
  const recetas = await Receta.find().lean();
  set.status = 200;
  return { recetas };
}

export async function createReceta(context: ElysiaContext) {
  const { set, body } = context;
  const recetaData = body as { clerkUserId?: string; nota?: string; personas?: number; archivoUrl?: string };
  const nuevo = {
    clerkUserId: recetaData.clerkUserId || '',
    nota: recetaData.nota || '',
    personas: recetaData.personas || 0,
    archivoUrl: recetaData.archivoUrl || '',
    estado: 'PENDIENTE',
  };
  const receta = await Receta.create(nuevo);
  set.status = 201;
  return receta;
}

export async function updateReceta(context: ElysiaContext) {
  const { set, params, body } = context;
  const receta = await Receta.findByIdAndUpdate(
    params.id,
    { $set: { ...body, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!receta) {
    set.status = 404;
    return { error: 'Receta no encontrada' };
  }
  set.status = 200;
  return receta;
}

export async function deleteReceta(context: ElysiaContext) {
  const { set, params } = context;
  const result = await Receta.findByIdAndDelete(params.id);
  if (!result) {
    set.status = 404;
    return { error: 'Receta no encontrada' };
  }
  set.status = 200;
  return { success: true };
}