import {
  getDashboardStats,
  getPasteles,
  createPastel,
  updatePastel,
  deletePastel,
  getPedidos,
  updatePedidoStatus,
  getRecetas,
  createReceta,
  updateReceta,
  deleteReceta,
} from '@/lib/adminApi';
import type { PastelCreateInput, PedidoStatusUpdateInput, RecetaCreateInput, RecetaUpdateInput } from '@/lib/adminApi';

const TOKEN = 'admin-token';

type JsonBody = Record<string, unknown>;

function mockResponse(ok: boolean, status: number, body: JsonBody | null, jsonThrows = false) {
  return {
    ok,
    status,
    json: jsonThrows
      ? async () => {
          throw new Error('bad json');
        }
      : async () => body,
  };
}

describe('adminApi', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('getDashboardStats', () => {
    it('maps the raw stats payload', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, {
          stats: {
            pedidosHoy: 5,
            recetasPendientes: 3,
            productos: 12,
            ingresosMes: 8400,
          },
        }),
      );

      const stats = await getDashboardStats(TOKEN);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/stats',
        expect.objectContaining({
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        }),
      );
      expect(stats).toEqual({
        totalPedidos: 5,
        totalRecetas: 3,
        totalPasteles: 12,
        ingresosMes: 8400,
        recentPedidos: [],
      });
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(getDashboardStats(TOKEN)).rejects.toThrow('Request failed');
    });
  });

  describe('getPasteles', () => {
    it('builds the query string from search/page/limit', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { pasteles: [], total: 25, page: 2, limit: 10 }),
      );

      const res = await getPasteles(TOKEN, { search: 'choco', page: 2, limit: 10 });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pasteles?search=choco&page=2&limit=10',
        expect.anything(),
      );
      expect(res.data).toEqual([]);
      expect(res.total).toBe(25);
      expect(res.page).toBe(2);
      expect(res.totalPages).toBe(3); // ceil(25/10)
    });

    it('omits query string when no params provided', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { pasteles: [{ _id: '1' }], total: 1, page: 1, limit: 10 }),
      );

      const res = await getPasteles(TOKEN);
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/pasteles', expect.anything());
      expect(res.data).toHaveLength(1);
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 404, null));
      await expect(getPasteles(TOKEN, { search: 'x' })).rejects.toThrow('Request failed');
    });
  });

  describe('createPastel', () => {
    it('POSTs the payload and returns the created pastel', async () => {
      const input: PastelCreateInput = {
        nombre: 'Nuevo',
        precio: 300,
        categoria: 'vainilla',
        imagen: 'x.jpg',
      };
      fetchMock.mockResolvedValue(mockResponse(true, 201, { _id: '99', ...input }));

      const res = await createPastel(TOKEN, input);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pasteles',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
      );
      expect(res._id).toBe('99');
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 400, null));
      await expect(createPastel(TOKEN, { nombre: 'X', precio: 1, categoria: 'c', imagen: 'i' })).rejects.toThrow(
        'Request failed',
      );
    });
  });

  describe('updatePastel', () => {
    it('PUTs the update and returns the pastel', async () => {
      const input: PastelCreateInput = { nombre: 'Edit', precio: 1, categoria: 'c', imagen: 'i' };
      fetchMock.mockResolvedValue(mockResponse(true, 200, { _id: '7', ...input }));

      const res = await updatePastel(TOKEN, '7', input);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pasteles/7',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(input) }),
      );
      expect(res._id).toBe('7');
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(updatePastel(TOKEN, '7', { nombre: 'x' })).rejects.toThrow('Request failed');
    });
  });

  describe('deletePastel', () => {
    it('DELETEs and resolves with no value', async () => {
      fetchMock.mockResolvedValue(mockResponse(true, 204, null));
      await expect(deletePastel(TOKEN, '7')).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pasteles/7',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 404, null));
      await expect(deletePastel(TOKEN, '7')).rejects.toThrow('Request failed');
    });
  });

  describe('getPedidos', () => {
    it('builds query string from status/date/page/limit', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { pedidos: [], total: 4, page: 1, totalPages: 2 }),
      );

      const res = await getPedidos(TOKEN, { status: 'PAGADO', date: '2024-01-01', page: 1, limit: 5 });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pedidos?status=PAGADO&date=2024-01-01&page=1&limit=5',
        expect.anything(),
      );
      expect(res.totalPages).toBe(2);
    });

    it('omits query string when no params', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { pedidos: [], total: 0, page: 1, totalPages: 1 }),
      );
      await getPedidos(TOKEN);
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/pedidos', expect.anything());
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(getPedidos(TOKEN, { status: 'X' })).rejects.toThrow('Request failed');
    });
  });

  describe('updatePedidoStatus', () => {
    it('PUTs the status body and returns the pedido', async () => {
      const body: PedidoStatusUpdateInput = { status: 'LISTO' };
      fetchMock.mockResolvedValue(mockResponse(true, 200, { _id: 'p', estado: 'LISTO' }));

      const res = await updatePedidoStatus(TOKEN, 'p', 'LISTO');
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/pedidos/p/status',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
      );
      expect(res.estado).toBe('LISTO');
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(updatePedidoStatus(TOKEN, 'p', 'LISTO')).rejects.toThrow('Request failed');
    });
  });

  describe('getRecetas', () => {
    it('builds query string from page/limit', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { recetas: [], total: 9, page: 2, totalPages: 5 }),
      );

      const res = await getRecetas(TOKEN, { page: 2, limit: 3 });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/recetas?page=2&limit=3',
        expect.anything(),
      );
      expect(res.totalPages).toBe(5);
    });

    it('omits query string when no params', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(true, 200, { recetas: [], total: 0, page: 1, totalPages: 1 }),
      );
      await getRecetas(TOKEN);
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/recetas', expect.anything());
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(getRecetas(TOKEN, { page: 1 })).rejects.toThrow('Request failed');
    });
  });

  describe('createReceta', () => {
    it('POSTs the new receta', async () => {
      const input: RecetaCreateInput = { nombre: 'R', descripcion: 'd' };
      fetchMock.mockResolvedValue(mockResponse(true, 201, { _id: 'r', ...input }));

      const res = await createReceta(TOKEN, input);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/recetas',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
      );
      expect(res._id).toBe('r');
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 400, null));
      await expect(createReceta(TOKEN, { nombre: 'R' })).rejects.toThrow('Request failed');
    });
  });

  describe('updateReceta', () => {
    it('PUTs the update', async () => {
      const input: RecetaUpdateInput = { estado: 'ACEPTADA', cotizacion: 500 };
      fetchMock.mockResolvedValue(mockResponse(true, 200, { _id: 'r', ...input }));

      const res = await updateReceta(TOKEN, 'r', input);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/recetas/r',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(input) }),
      );
      expect(res.cotizacion).toBe(500);
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 500, null));
      await expect(updateReceta(TOKEN, 'r', { estado: 'X' })).rejects.toThrow('Request failed');
    });
  });

  describe('deleteReceta', () => {
    it('DELETEs and resolves', async () => {
      fetchMock.mockResolvedValue(mockResponse(true, 204, null));
      await expect(deleteReceta(TOKEN, 'r')).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/recetas/r',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(false, 404, null));
      await expect(deleteReceta(TOKEN, 'r')).rejects.toThrow('Request failed');
    });
  });
});
