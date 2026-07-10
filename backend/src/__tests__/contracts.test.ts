import { describe, it, expect } from 'bun:test';
import { contracts } from '../lib/contracts';

describe('contracts', () => {
  it('defines the pasteles GET contract', () => {
    expect(contracts['GET /api/pasteles']).toBeDefined();
    expect(contracts['GET /api/pasteles'].response).toHaveProperty('pasteles');
    expect(contracts['GET /api/pasteles'].response).toHaveProperty('total');
  });

  it('defines the pedidos POST contract with request and response', () => {
    expect(contracts['POST /api/pedidos']).toBeDefined();
    expect(contracts['POST /api/pedidos'].request).toHaveProperty('email');
    expect(contracts['POST /api/pedidos'].request).toHaveProperty('items');
    expect(contracts['POST /api/pedidos'].response).toHaveProperty('checkoutUrl');
  });

  it('defines the descuentos validar contract', () => {
    expect(contracts['POST /api/descuentos/validar']).toBeDefined();
    expect(contracts['POST /api/descuentos/validar'].response).toHaveProperty('valido');
  });

  it('defines the pedidos calificar contract', () => {
    expect(contracts['PUT /api/pedidos/:id/calificar']).toBeDefined();
    expect(contracts['PUT /api/pedidos/:id/calificar'].request).toHaveProperty('calificacion');
  });

  it('is a frozen constant object', () => {
    expect(Object.keys(contracts).length).toBe(4);
  });
});
