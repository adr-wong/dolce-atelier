import { describe, it, expect } from 'bun:test';
import { CrearPastelSchema, ActualizarPastelSchema, FiltroPastelesSchema } from '../schemas/pastel';

describe('CrearPastelSchema', () => {
  const valid = {
    nombre: 'Pastel de chocolate',
    precio: 250,
    categoria: 'Clásicos',
    imagen: 'https://example.com/img.jpg',
  };

  it('accepts valid data', () => {
    expect(CrearPastelSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts with optional fields', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, descripcion: 'Delicioso' }).success).toBe(true);
  });

  it('applies default for disponible', () => {
    const result = CrearPastelSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.disponible).toBe(true);
  });

  it('accepts explicit disponible false', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, disponible: false }).success).toBe(true);
  });

  it('rejects missing nombre', () => {
    const { nombre, ...rest } = valid;
    expect(CrearPastelSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty nombre', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, nombre: '' }).success).toBe(false);
  });

  it('rejects nombre > 100 chars', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, nombre: 'x'.repeat(101) }).success).toBe(false);
  });

  it('rejects negative precio', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, precio: -10 }).success).toBe(false);
  });

  it('rejects zero precio', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, precio: 0 }).success).toBe(false);
  });

  it('rejects missing imagen', () => {
    const { imagen, ...rest } = valid;
    expect(CrearPastelSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects invalid URL', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, imagen: 'not-a-url' }).success).toBe(false);
  });

  it('rejects missing categoria', () => {
    const { categoria, ...rest } = valid;
    expect(CrearPastelSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty categoria', () => {
    expect(CrearPastelSchema.safeParse({ ...valid, categoria: '' }).success).toBe(false);
  });
});

describe('ActualizarPastelSchema', () => {
  it('accepts partial update with just nombre', () => {
    expect(ActualizarPastelSchema.safeParse({ nombre: 'Nuevo' }).success).toBe(true);
  });

  it('accepts partial update with just precio', () => {
    expect(ActualizarPastelSchema.safeParse({ precio: 100 }).success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    expect(ActualizarPastelSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid precio in partial', () => {
    expect(ActualizarPastelSchema.safeParse({ precio: -5 }).success).toBe(false);
  });

  it('rejects invalid URL in partial', () => {
    expect(ActualizarPastelSchema.safeParse({ imagen: 'bad' }).success).toBe(false);
  });
});

describe('FiltroPastelesSchema', () => {
  it('accepts empty object', () => {
    expect(FiltroPastelesSchema.safeParse({}).success).toBe(true);
  });

  it('coerces string numbers to numbers for precioMin', () => {
    const result = FiltroPastelesSchema.safeParse({ precioMin: '50' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.precioMin).toBe(50);
  });

  it('coerces string numbers to numbers for precioMax', () => {
    const result = FiltroPastelesSchema.safeParse({ precioMax: '200' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.precioMax).toBe(200);
  });

  it('coerces page and limit', () => {
    const result = FiltroPastelesSchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('accepts valid ordenarPor enum', () => {
    expect(FiltroPastelesSchema.safeParse({ ordenarPor: 'precio' }).success).toBe(true);
    expect(FiltroPastelesSchema.safeParse({ ordenarPor: 'nombre' }).success).toBe(true);
    expect(FiltroPastelesSchema.safeParse({ ordenarPor: 'createdAt' }).success).toBe(true);
  });

  it('rejects invalid ordenarPor', () => {
    expect(FiltroPastelesSchema.safeParse({ ordenarPor: 'invalid' }).success).toBe(false);
  });

  it('accepts valid orden enum', () => {
    expect(FiltroPastelesSchema.safeParse({ orden: 'asc' }).success).toBe(true);
    expect(FiltroPastelesSchema.safeParse({ orden: 'desc' }).success).toBe(true);
  });

  it('rejects invalid orden', () => {
    expect(FiltroPastelesSchema.safeParse({ orden: 'random' }).success).toBe(false);
  });

  it('accepts string filter fields', () => {
    expect(FiltroPastelesSchema.safeParse({ categoria: 'x', disponible: 'true', q: 'choco' }).success).toBe(true);
  });
});
