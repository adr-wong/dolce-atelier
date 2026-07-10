import { describe, it, expect, mock } from 'bun:test';

const RecetaFind = mock();
const RecetaCreate = mock();
const RecetaFindByIdAndUpdate = mock();
const RecetaFindByIdAndDelete = mock();

function makeQuery(docs: any[]) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation']) q[m] = () => q;
  q.then = (resolve: any) => resolve(docs);
  return q;
}

mock.module('../models', () => ({
  Receta: {
    find: (...a: any[]) => RecetaFind(...a),
    create: (...a: any[]) => RecetaCreate(...a),
    findByIdAndUpdate: (...a: any[]) => RecetaFindByIdAndUpdate(...a),
    findByIdAndDelete: (...a: any[]) => RecetaFindByIdAndDelete(...a),
  },
  Pastel: {},
  Pedido: {},
  WebhookEvent: {},
  AuditLog: {},
  CodigoDescuento: {},
  Categoria: {},
}));

const { listRecetas, createReceta, updateReceta, deleteReceta } = await import(
  '../controllers/admin/recetaController'
);

describe('listRecetas', () => {
  it('returns all recetas with status 200', async () => {
    RecetaFind.mockReturnValue(makeQuery([{ _id: 'r1' }, { _id: 'r2' }]));
    const set = { status: 0 };
    const result = await listRecetas({ set, query: {}, params: {}, body: {} } as any);
    expect(set.status).toBe(200);
    expect(result.recetas).toHaveLength(2);
  });
});

describe('createReceta', () => {
  it('creates a receta with PENDIENTE default and status 201', async () => {
    const nuevo = { _id: 'r3', estado: 'PENDIENTE' };
    RecetaCreate.mockResolvedValue(nuevo);
    const set = { status: 0 };
    const result = await createReceta({
      set,
      query: {},
      params: {},
      body: { nota: 'Pastel de boda', personas: 50 },
    } as any);
    expect(set.status).toBe(201);
    expect(result).toBe(nuevo);
    expect(RecetaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ nota: 'Pastel de boda', personas: 50, estado: 'PENDIENTE' }),
    );
  });
});

describe('updateReceta', () => {
  it('returns 404 when the receta does not exist', async () => {
    RecetaFindByIdAndUpdate.mockResolvedValue(null);
    const set = { status: 0 };
    const result = await updateReceta({
      set,
      params: { id: 'nope' },
      body: { estado: 'COTIZADA' },
    } as any);
    expect(set.status).toBe(404);
    expect(result).toHaveProperty('error', 'Receta no encontrada');
  });

  it('returns the updated receta on success', async () => {
    const doc = { _id: 'r4' };
    RecetaFindByIdAndUpdate.mockResolvedValue(doc);
    const set = { status: 0 };
    const result = await updateReceta({
      set,
      params: { id: 'r4' },
      body: { estado: 'ACEPTADA' },
    } as any);
    expect(set.status).toBe(200);
    expect(result).toBe(doc);
  });
});

describe('deleteReceta', () => {
  it('returns 404 when the receta does not exist', async () => {
    RecetaFindByIdAndDelete.mockResolvedValue(null);
    const set = { status: 0 };
    const result = await deleteReceta({ set, params: { id: 'nope' }, body: {} } as any);
    expect(set.status).toBe(404);
    expect(result).toHaveProperty('error', 'Receta no encontrada');
  });

  it('returns success when deleted', async () => {
    RecetaFindByIdAndDelete.mockResolvedValue({ _id: 'r5' });
    const set = { status: 0 };
    const result = await deleteReceta({ set, params: { id: 'r5' }, body: {} } as any);
    expect(set.status).toBe(200);
    expect(result).toEqual({ success: true });
  });
});
