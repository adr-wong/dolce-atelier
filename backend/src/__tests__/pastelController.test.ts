import { describe, it, expect, mock, beforeEach } from 'bun:test';

const PastelFind = mock();
const PastelCountDocuments = mock();
const PastelCreate = mock();
const PastelFindByIdAndUpdate = mock();
const PastelFindById = mock();
const PastelFindByIdAndDelete = mock();

function makeChainable(val: any) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation', 'lean']) q[m] = () => q;
  q.then = (resolve: any, reject?: any) => Promise.resolve(val).then(resolve, reject);
  return q;
}

function makeQuery(docs: any[]) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation', 'lean']) q[m] = () => q;
  q.then = (resolve: any) => resolve(docs);
  return q;
}

mock.module('../models', () => ({
  Pastel: {
    find: (...a: any[]) => PastelFind(...a),
    countDocuments: (...a: any[]) => PastelCountDocuments(...a),
    create: (...a: any[]) => PastelCreate(...a),
    findByIdAndUpdate: (...a: any[]) => PastelFindByIdAndUpdate(...a),
    findById: (...a: any[]) => PastelFindById(...a),
    findByIdAndDelete: (...a: any[]) => PastelFindByIdAndDelete(...a),
  },
  Pedido: {},
  Receta: {},
  WebhookEvent: {},
  AuditLog: {},
  CodigoDescuento: {},
  Categoria: {},
}));

// Mock the npm `cloudinary` package (NOT the ../services/cloudinary
// submodule) so the real submodule runs. This matches the mock used
// by services-cloudinary.test.ts, so it does not leak a partial
// submodule shape into that file.
mock.module('cloudinary', () => ({
  v2: {
    config: () => {},
    uploader: { upload_stream: mock(), destroy: mock(async () => ({ result: 'ok' })) },
  },
}));

const { listPasteles, createPastel, updatePastel, deletePastel } = await import(
  '../controllers/admin/pastelController'
);

beforeEach(() => {
  for (const m of [
    PastelFind,
    PastelCountDocuments,
    PastelCreate,
    PastelFindByIdAndUpdate,
    PastelFindById,
    PastelFindByIdAndDelete,
  ]) {
    m.mockClear();
  }
});

describe('listPasteles', () => {
  it('builds an $or search filter and returns pagination meta', async () => {
    PastelFind.mockReturnValue(makeQuery([]));
    PastelCountDocuments.mockResolvedValue(4);

    const set = { status: 0 };
    const result = await listPasteles({
      set,
      query: { search: 'choco', page: 1 },
      params: {},
      body: {},
    } as any);

    expect(set.status).toBe(200);
    const q = PastelFind.mock.calls[0][0];
    expect(Array.isArray(q.$or)).toBe(true);
    expect(q.$or[0].nombre).toBeInstanceOf(RegExp);
    expect(result.total).toBe(4);
    expect(result.limit).toBe(100);
  });

  it('queries without search when none provided', async () => {
    PastelFind.mockReturnValue(makeQuery([]));
    PastelCountDocuments.mockResolvedValue(0);
    const set = { status: 0 };
    await listPasteles({ set, query: {}, params: {}, body: {} } as any);
    expect(PastelFind.mock.calls[0][0]).not.toHaveProperty('$or');
  });
});

describe('createPastel', () => {
  it('creates a pastel and maps the plain object response', async () => {
    const createdAt = new Date('2026-05-05');
    PastelCreate.mockResolvedValue({
      toObject: () => ({
        _id: { toString: () => 'pastel1' },
        nombre: 'Brownie',
        descripcion: 'rico',
        precio: 120,
        imagen: 'https://img/b.jpg',
        categoria: 'Clásicos',
        disponible: true,
        createdAt,
        updatedAt: createdAt,
      }),
    });

    const set = { status: 0 };
    const result = await createPastel({
      set,
      query: {},
      params: {},
      body: { nombre: 'Brownie', precio: 120, imagen: 'https://img/b.jpg', categoria: 'Clásicos' },
    } as any);

    expect(set.status).toBe(201);
    expect(result._id).toBe('pastel1');
    expect(result.nombre).toBe('Brownie');
    expect(result.disponible).toBe(true);
    expect(result.createdAt).toBe(createdAt.toISOString());
    expect(PastelCreate).toHaveBeenCalledWith(
      expect.objectContaining({ disponible: true, categoria: 'Clásicos' }),
    );
  });

  it('defaults missing optional fields', async () => {
    PastelCreate.mockResolvedValue({
      toObject: () => ({
        _id: { toString: () => 'p2' },
        nombre: 'Simple',
        descripcion: '',
        precio: 10,
        imagen: '',
        categoria: 'general',
        disponible: true,
      }),
    });
    const set = { status: 0 };
    await createPastel({
      set,
      query: {},
      params: {},
      body: { nombre: 'Simple', precio: 10 },
    } as any);
    expect(PastelCreate.mock.calls[0][0].descripcion).toBe('');
    expect(PastelCreate.mock.calls[0][0].categoria).toBe('general');
  });
});

describe('updatePastel', () => {
  it('returns 404 when the pastel does not exist', async () => {
    PastelFindByIdAndUpdate.mockReturnValue(makeChainable(null));
    const set = { status: 0 };
    const result = await updatePastel({
      set,
      params: { id: 'nope' },
      body: { precio: 99 },
    } as any);
    expect(set.status).toBe(404);
    expect(result).toHaveProperty('error', 'Pastel no encontrado');
  });

  it('returns the updated pastel on success', async () => {
    const doc = { _id: 'p3', nombre: 'X' };
    PastelFindByIdAndUpdate.mockReturnValue(makeChainable(doc));
    const set = { status: 0 };
    const result = await updatePastel({
      set,
      params: { id: 'p3' },
      body: { nombre: 'X' },
    } as any);
    expect(set.status).toBe(200);
    expect(result).toBe(doc);
  });
});

describe('deletePastel', () => {
  it('returns 404 when the pastel does not exist', async () => {
    PastelFindById.mockResolvedValue(null);
    const set = { status: 0 };
    const result = await deletePastel({ set, params: { id: 'nope' }, body: {} } as any);
    expect(set.status).toBe(404);
    expect(result).toHaveProperty('error', 'Pastel no encontrado');
  });

  it('deletes the image from Cloudinary then the pastel', async () => {
    PastelFindById.mockResolvedValue({
      imagen: 'http://res.cloudinary.com/d/u/upload/v123/folder/img.jpg',
    });
    PastelFindByIdAndDelete.mockResolvedValue({ _id: 'p4' });

    const set = { status: 0 };
    const result = await deletePastel({ set, params: { id: 'p4' }, body: {} } as any);

    expect(set.status).toBe(200);
    expect(result).toEqual({ success: true });
    expect(PastelFindByIdAndDelete).toHaveBeenCalledWith('p4');
  });

  it('skips Cloudinary deletion when there is no imagen', async () => {
    PastelFindById.mockResolvedValue({ imagen: '' });
    PastelFindByIdAndDelete.mockResolvedValue({ _id: 'p5' });
    const set = { status: 0 };
    await deletePastel({ set, params: { id: 'p5' }, body: {} } as any);
    expect(PastelFindByIdAndDelete).toHaveBeenCalledWith('p5');
  });
});
