import { describe, it, expect, mock } from 'bun:test';

// Mock the models module BEFORE importing the controller (controllers import from
// '../../models' which resolves to the index module). This never hits the database.
const PastelCountDocuments = mock();
const PedidoCountDocuments = mock();
const RecetaCountDocuments = mock();
const PedidoFind = mock();

function makeQuery(docs: any[]) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation']) q[m] = () => q;
  q.then = (resolve: any) => resolve(docs);
  return q;
}

mock.module('../models', () => ({
  Pastel: { countDocuments: (...a: any[]) => PastelCountDocuments(...a) },
  Pedido: {
    countDocuments: (...a: any[]) => PedidoCountDocuments(...a),
    find: (...a: any[]) => PedidoFind(...a),
  },
  Receta: { countDocuments: (...a: any[]) => RecetaCountDocuments(...a) },
  WebhookEvent: {},
  AuditLog: {},
  CodigoDescuento: {},
  Categoria: {},
}));

const { getDashboardStats } = await import('../controllers/admin/dashboardController');

describe('getDashboardStats', () => {
  it('returns aggregate counts and recent pedidos', async () => {
    PastelCountDocuments.mockResolvedValue(7);
    PedidoCountDocuments.mockResolvedValue(12);
    RecetaCountDocuments.mockResolvedValue(3);
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
    expect(result.recentPedidos).toHaveLength(2);
    expect(result.recentPedidos[0]).toEqual({
      id: 'p1',
      status: 'PAGADO',
      total: 250,
      createdAt: new Date('2026-01-01').toISOString(),
    });
  });
});
