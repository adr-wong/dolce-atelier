import { describe, it, expect } from 'bun:test';

describe('Order State Transitions', () => {
  const allowedTransitions: Record<string, string[]> = {
    PENDIENTE: ['PAGADO', 'CANCELADO'],
    PAGADO: ['PREPARANDO', 'CANCELADO'],
    PREPARANDO: ['LISTO', 'CANCELADO'],
    LISTO: ['EN_CAMINO', 'CANCELADO'],
    EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
    ENTREGADO: [],
    CANCELADO: [],
  };

  it('should allow valid transition from PENDIENTE to PAGADO', () => {
    expect(allowedTransitions['PENDIENTE']).toContain('PAGADO');
  });

  it('should allow valid transition from PAGADO to PREPARANDO', () => {
    expect(allowedTransitions['PAGADO']).toContain('PREPARANDO');
  });

  it('should not allow transition from PENDIENTE to ENTREGADO', () => {
    expect(allowedTransitions['PENDIENTE']).not.toContain('ENTREGADO');
  });

  it('should not allow transition from CANCELADO to any state', () => {
    expect(allowedTransitions['CANCELADO']).toHaveLength(0);
  });

  it('should not allow transition from ENTREGADO to any state', () => {
    expect(allowedTransitions['ENTREGADO']).toHaveLength(0);
  });
});
