import { MOCK_PASTELES, MOCK_CATEGORIAS } from '@/lib/mock-data';

describe('mock-data', () => {
  it('exports 15 pasteles each with the required Pastel fields', () => {
    expect(MOCK_PASTELES).toHaveLength(15);

    MOCK_PASTELES.forEach((p) => {
      expect(typeof p._id).toBe('string');
      expect(p._id.length).toBeGreaterThan(0);
      expect(typeof p.nombre).toBe('string');
      expect(typeof p.precio).toBe('number');
      expect(p.precio).toBeGreaterThan(0);
      expect(typeof p.categoria).toBe('string');
      expect(typeof p.imagen).toBe('string');
      expect(typeof p.disponible).toBe('boolean');
    });
  });

  it('categorias include "todos" plus the three product categories', () => {
    expect(MOCK_CATEGORIAS).toContain('todos');
    expect(MOCK_CATEGORIAS).toContain('chocolate');
    expect(MOCK_CATEGORIAS).toContain('vainilla');
    expect(MOCK_CATEGORIAS).toContain('frutas');
  });

  it('pasteles are grouped across the three product categories', () => {
    const categorias = new Set(MOCK_PASTELES.map((p) => p.categoria));
    expect(categorias.has('chocolate')).toBe(true);
    expect(categorias.has('vainilla')).toBe(true);
    expect(categorias.has('frutas')).toBe(true);
  });

  it('every category except "todos" has at least one pastel', () => {
    MOCK_CATEGORIAS.filter((c) => c !== 'todos').forEach((cat) => {
      const count = MOCK_PASTELES.filter((p) => p.categoria === cat).length;
      expect(count).toBeGreaterThan(0);
    });
  });
});
