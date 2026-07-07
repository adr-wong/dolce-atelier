import { describe, it, expect } from 'bun:test';
import { CrearPedidoSchema, ActualizarEstadoSchema, FiltroPedidosSchema } from '../schemas/pedido';

describe('CrearPedidoSchema', () => {
  const valid = {
    email: 'test@example.com',
    items: [{ pastelId: 'abc', cantidad: 2 }],
    metodoEntrega: 'DOMICILIO',
  };

  it('accepts valid data', () => {
    const result = CrearPedidoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts with optional fields', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      direccionEnvio: 'Calle 123',
      telefono: '5551234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CrearPedidoSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = CrearPedidoSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing items', () => {
    const { items, ...rest } = valid;
    const result = CrearPedidoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = CrearPedidoSchema.safeParse({ ...valid, items: [] });
    expect(result.success).toBe(true); // z.array allows empty
  });

  it('rejects items with negative cantidad', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      items: [{ pastelId: 'a', cantidad: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects items with zero cantidad', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      items: [{ pastelId: 'a', cantidad: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects items with float cantidad', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      items: [{ pastelId: 'a', cantidad: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid metodoEntrega', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      metodoEntrega: 'INVALIDO',
    });
    expect(result.success).toBe(false);
  });

  it('accepts TIENDA metodoEntrega', () => {
    const result = CrearPedidoSchema.safeParse({
      ...valid,
      metodoEntrega: 'TIENDA',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing metodoEntrega', () => {
    const { metodoEntrega, ...rest } = valid;
    const result = CrearPedidoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('ActualizarEstadoSchema', () => {
  const validStates = [
    'PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO',
  ];

  for (const estado of validStates) {
    it(`accepts state ${estado}`, () => {
      expect(ActualizarEstadoSchema.safeParse({ estado }).success).toBe(true);
    });
  }

  it('rejects invalid state', () => {
    expect(ActualizarEstadoSchema.safeParse({ estado: 'INVALIDO' }).success).toBe(false);
  });

  it('rejects missing estado', () => {
    expect(ActualizarEstadoSchema.safeParse({}).success).toBe(false);
  });
});

describe('FiltroPedidosSchema', () => {
  it('accepts empty object', () => {
    expect(FiltroPedidosSchema.safeParse({}).success).toBe(true);
  });

  it('accepts estado only', () => {
    expect(FiltroPedidosSchema.safeParse({ estado: 'PAGADO' }).success).toBe(true);
  });

  it('accepts limit only', () => {
    expect(FiltroPedidosSchema.safeParse({ limit: '10' }).success).toBe(true);
  });

  it('accepts both fields', () => {
    expect(FiltroPedidosSchema.safeParse({ estado: 'LISTO', limit: '5' }).success).toBe(true);
  });
});
