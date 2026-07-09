import { api } from '@/lib/api';

describe('api client (fetchAPI wrapper)', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('lists pasteles successfully', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pasteles: [{ _id: '1', nombre: 'T' }] }),
    });

    const res = await api.pasteles.listar();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pasteles',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(res.pasteles).toHaveLength(1);
    expect(res.pasteles[0].nombre).toBe('T');
  });

  it('obtains a single pastel by id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ _id: '5', nombre: 'X' }),
    });

    const res = await api.pasteles.obtener('5');

    expect(fetchMock).toHaveBeenCalledWith('/api/pasteles/5', expect.anything());
    expect(res._id).toBe('5');
  });

  it('creates a pedido with POST and JSON body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ pedido: { id: 'p1' } }),
    });

    const res = await api.pedidos.crear({ a: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pedidos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ a: 1 }) }),
    );
    expect(res.pedido).toEqual({ id: 'p1' });
  });

  it('lists pedidos', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pedidos: [{ id: 'p' }] }),
    });

    const res = await api.pedidos.listar();
    expect(fetchMock).toHaveBeenCalledWith('/api/pedidos', expect.anything());
    expect(res.pedidos).toHaveLength(1);
  });

  it('creates a receta with a FormData body', async () => {
    const fd = new FormData();
    fd.append('a', 'b');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ receta: { id: 'r1' } }),
    });

    const res = await api.recetas.crear(fd);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recetas',
      expect.objectContaining({ method: 'POST', body: fd }),
    );
    expect(res.receta).toEqual({ id: 'r1' });
  });

  it('lists recetas', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ recetas: [{ id: 'r' }] }),
    });

    const res = await api.recetas.listar();
    expect(res.recetas).toHaveLength(1);
  });

  it('throws with the error message from the response body', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    });

    await expect(api.pasteles.listar()).rejects.toThrow('Bad request');
  });

  it('throws a default HTTP message when body has no message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(api.pasteles.listar()).rejects.toThrow('HTTP 500');
  });

  it('uses "Error desconocido" fallback when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(api.pasteles.listar()).rejects.toThrow('Error desconocido');
  });

  it('rethrows network errors from fetch', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(api.pasteles.listar()).rejects.toThrow('network down');
  });
});
