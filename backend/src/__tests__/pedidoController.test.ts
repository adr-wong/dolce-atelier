import { describe, it, expect, mock, beforeEach } from 'bun:test';

const PedidoFind = mock();
const PedidoCountDocuments = mock();
const PedidoFindById = mock();
const PedidoFindByIdAndUpdate = mock();
const AuditLogLog = mock();

function makeQuery(docs: any[]) {
  const q: any = {};
  for (const m of ['sort', 'skip', 'limit', 'select', 'collation', 'lean']) q[m] = () => q;
  q.then = (resolve: any) => resolve(docs);
  return q;
}

mock.module('../models', () => ({
  Pedido: {
    find: (...a: any[]) => PedidoFind(...a),
    countDocuments: (...a: any[]) => PedidoCountDocuments(...a),
    findById: (...a: any[]) => PedidoFindById(...a),
    findByIdAndUpdate: (...a: any[]) => PedidoFindByIdAndUpdate(...a),
  },
  Pastel: {},
  Receta: {},
  WebhookEvent: {},
  AuditLog: {},
  CodigoDescuento: {},
  Categoria: {},
}));

mock.module('../services/auditLog', () => ({
  auditLogService: { log: (...a: any[]) => AuditLogLog(...a) },
}));

const { listPedidos, updatePedidoStatus } = await import('../controllers/admin/pedidoController');

beforeEach(() => {
  for (const m of [PedidoFind, PedidoCountDocuments, PedidoFindById, PedidoFindByIdAndUpdate, AuditLogLog]) {
    m.mockClear();
  }
});

describe('listPedidos', () => {
  it('filters by status, paginates, and returns totalPages', async () => {
    PedidoFind.mockReturnValue(makeQuery([]));
    PedidoCountDocuments.mockResolvedValue(25);

    const set = { status: 0 };
    const result = await listPedidos({
      set,
      query: { status: 'PAGADO', page: '2', limit: '10' },
      params: {},
      body: {},
    } as any);

    expect(set.status).toBe(200);
    expect(PedidoFindById).not.toHaveBeenCalled();
    expect(PedidoFind.mock.calls[0][0]).toMatchObject({ estado: 'PAGADO' });
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('builds a date range filter when date is present', async () => {
    PedidoFind.mockReturnValue(makeQuery([]));
    PedidoCountDocuments.mockResolvedValue(0);

    const set = { status: 0 };
    await listPedidos({
      set,
      query: { date: '2026-03-15' },
      params: {},
      body: {},
    } as any);

    const q = PedidoFind.mock.calls[0][0];
    expect(q.createdAt).toBeDefined();
    expect(q.createdAt.$gte).toBeInstanceOf(Date);
    expect(q.createdAt.$lt).toBeInstanceOf(Date);
  });
});

describe('updatePedidoStatus', () => {
  it('returns 404 when the pedido does not exist', async () => {
    PedidoFindById.mockResolvedValue(null);
    const set = { status: 0 };
    const result = await updatePedidoStatus({
      set,
      params: { id: 'missing' },
      body: { status: 'PAGADO' },
    } as any);
    expect(set.status).toBe(404);
    expect(result).toHaveProperty('error', 'Pedido no encontrado');
  });

  it('returns 400 for an invalid transition', async () => {
    PedidoFindById.mockResolvedValue({ estado: 'ENTREGADO' });
    const set = { status: 0 };
    const result = await updatePedidoStatus({
      set,
      params: { id: 'p1' },
      body: { status: 'PAGADO' },
    } as any);
    expect(set.status).toBe(400);
    expect(result.error).toContain('Transición no válida');
  });

  it('allows a valid transition and writes an audit log', async () => {
    PedidoFindById.mockResolvedValue({ estado: 'PENDIENTE' });
    const updated = { _id: 'p1', estado: 'PAGADO', toJSON() { return this; } };
    PedidoFindByIdAndUpdate.mockResolvedValue(updated);

    const set = { status: 0 };
    const result = await updatePedidoStatus({
      set,
      params: { id: 'p1' },
      body: { status: 'PAGADO' },
    } as any);

    expect(set.status).toBe(200);
    expect(result).toBe(updated);
    expect(PedidoFindByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: { estado: 'PAGADO', updatedAt: expect.any(Date) } },
      { new: true },
    );
    expect(AuditLogLog).toHaveBeenCalledTimes(1);
    expect(AuditLogLog.mock.calls[0][0]).toMatchObject({
      action: 'ADMIN_UPDATE_PEDIDO_STATUS',
      metadata: { pedidoId: 'p1', oldStatus: 'PENDIENTE', newStatus: 'PAGADO' },
    });
  });

  it('allows cancelling from any state', async () => {
    PedidoFindById.mockResolvedValue({ estado: 'PREPARANDO' });
    PedidoFindByIdAndUpdate.mockResolvedValue({ _id: 'p2', estado: 'CANCELADO', toJSON() { return this; } });
    const set = { status: 0 };
    const result = await updatePedidoStatus({
      set,
      params: { id: 'p2' },
      body: { status: 'CANCELADO' },
    } as any);
    expect(set.status).toBe(200);
    expect(result.estado).toBe('CANCELADO');
  });
});
