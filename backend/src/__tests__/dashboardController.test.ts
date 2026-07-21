import { describe, it, expect, mock, afterAll } from 'bun:test';

// Mock the models module BEFORE importing the controller (controllers import from
// '../../models' which resolves to the index module). This never hits the database.
const PastelCountDocuments = mock();
const PedidoCountDocuments = mock();
const RecetaCountDocuments = mock();
const PedidoFind = mock();
const PedidoAggregate = mock();

function makeQuery(docs: any[]) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation', 'lean']) q[m] = () => q;
  q.then = (resolve: any) => resolve(docs);
  return q;
}

mock.module('../models', () => ({
  Pastel: { countDocuments: (...a: any[]) => PastelCountDocuments(...a) },
  Pedido: {
    countDocuments: (...a: any[]) => PedidoCountDocuments(...a),
    find: (...a: any[]) => PedidoFind(...a),
    aggregate: (...a: any[]) => PedidoAggregate(...a),
  },
  Receta: { countDocuments: (...a: any[]) => RecetaCountDocuments(...a) },
  WebhookEvent: {},
  AuditLog: {},
  CodigoDescuento: {},
  Categoria: {},
}));

// Restore the global module mock after this file's tests so it does not leak
// into other test files (e.g. the integration test that needs the real models).
afterAll(() => {
  mock.restore();
});

const { getDashboardStats } = await import('../controllers/admin/dashboardController');

describe('getDashboardStats', () => {
  it('returns aggregate counts and recent pedidos', async () => {
    PastelCountDocuments.mockResolvedValue(7);
    RecetaCountDocuments.mockResolvedValue(3);
    // countDocuments returns 12 for the unfiltered total, 4 for the PENDIENTE filter.
    PedidoCountDocuments.mockImplementation((filter?: any) =>
      Promise.resolve(filter && filter.estado === 'PENDIENTE' ? 4 : 12),
    );
    PedidoAggregate.mockImplementation((pipeline: any[]) => {
      const groupStage = pipeline.find((s: any) => s.$group);
      // Ingresos pipeline groups with _id: null.
      if (groupStage && groupStage.$group._id === null) {
        return Promise.resolve([{ _id: null, total: 349 }]);
      }
      // Status breakdown pipeline groups by estado.
      return Promise.resolve([{ _id: 'PAGADO', count: 1 }, { _id: 'LISTO', count: 1 }]);
    });
    PedidoFind.mockReturnValue(
      makeQuery([
        { _id: { toString: () => 'p1' }, estado: 'PAGADO', total: 250, createdAt: new Date('2026-01-01') },
        { _id: { toString: () => 'p2' }, estado: 'LISTO', total: 99, createdAt: new Date('2026-02-02') },
      ]),
    );

    const set = { status: 0 };
    const result = await getDashboardStats({ set, query: {}, params: {}, body: {} } as any);

    expect(set.status).toBe(200);
    expect(result.totalPasteles).toBe(7);
    expect(result.totalPedidos).toBe(12);
    expect(result.totalRecetas).toBe(3);
    expect(result.pedidosPendientes).toBe(4);
    expect(result.totalIngresos).toBe(349);
    expect(result.statusBreakdown).toEqual({ PAGADO: 1, LISTO: 1 });
    expect(result.recentPedidos).toHaveLength(2);
    expect(result.recentPedidos[0]).toEqual({
      _id: 'p1',
      estado: 'PAGADO',
      total: 250,
      createdAt: new Date('2026-01-01').toISOString(),
      items: [],
    });
  });
});
