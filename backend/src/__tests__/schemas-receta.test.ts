import { describe, it, expect } from 'bun:test';
import { ActualizarRecetaSchema, CotizarRecetaSchema, FiltroRecetasSchema } from '../schemas/receta';

describe('ActualizarRecetaSchema', () => {
  const validStates = ['PENDIENTE', 'REVISANDO', 'COTIZADA', 'ACEPTADA', 'RECHAZADA'];

  for (const estado of validStates) {
    it(`accepts state ${estado}`, () => {
      expect(ActualizarRecetaSchema.safeParse({ estado }).success).toBe(true);
    });
  }

  it('accepts valid cotizacion', () => {
    expect(ActualizarRecetaSchema.safeParse({ cotizacion: 500 }).success).toBe(true);
  });

  it('accepts both fields', () => {
    expect(ActualizarRecetaSchema.safeParse({ estado: 'COTIZADA', cotizacion: 300 }).success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    expect(ActualizarRecetaSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid state', () => {
    expect(ActualizarRecetaSchema.safeParse({ estado: 'INVALIDO' }).success).toBe(false);
  });

  it('rejects negative cotizacion', () => {
    expect(ActualizarRecetaSchema.safeParse({ cotizacion: -10 }).success).toBe(false);
  });

  it('rejects zero cotizacion', () => {
    expect(ActualizarRecetaSchema.safeParse({ cotizacion: 0 }).success).toBe(false);
  });
});

describe('CotizarRecetaSchema', () => {
  it('accepts positive number', () => {
    expect(CotizarRecetaSchema.safeParse({ cotizacion: 100 }).success).toBe(true);
  });

  it('rejects negative number', () => {
    expect(CotizarRecetaSchema.safeParse({ cotizacion: -50 }).success).toBe(false);
  });

  it('rejects zero', () => {
    expect(CotizarRecetaSchema.safeParse({ cotizacion: 0 }).success).toBe(false);
  });

  it('rejects missing cotizacion', () => {
    expect(CotizarRecetaSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-number', () => {
    expect(CotizarRecetaSchema.safeParse({ cotizacion: 'abc' }).success).toBe(false);
  });
});

describe('FiltroRecetasSchema', () => {
  it('accepts empty object', () => {
    expect(FiltroRecetasSchema.safeParse({}).success).toBe(true);
  });

  it('accepts estado', () => {
    expect(FiltroRecetasSchema.safeParse({ estado: 'PENDIENTE' }).success).toBe(true);
  });

  it('accepts any string for estado (not enum-validated)', () => {
    expect(FiltroRecetasSchema.safeParse({ estado: 'anything' }).success).toBe(true);
  });
});
