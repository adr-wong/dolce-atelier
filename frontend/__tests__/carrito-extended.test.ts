import { useCarritoStore } from '@/store/carrito';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const makePastel = (id: string, precio = 100) => ({
  _id: id,
  nombre: `Pastel ${id}`,
  precio,
  categoria: 'chocolate',
  imagen: 'test.jpg',
  disponible: true,
});

describe('Carrito Store - actualizarCantidad', () => {
  beforeEach(() => {
    localStorage.clear();
    useCarritoStore.setState({ items: [] });
  });

  it('should update quantity when cantidad > 0', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);
    useCarritoStore.getState().actualizarCantidad('1', 5);

    const items = useCarritoStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(5);
  });

  it('should remove item when cantidad is 0', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);
    useCarritoStore.getState().actualizarCantidad('1', 0);

    expect(useCarritoStore.getState().items).toHaveLength(0);
  });

  it('should remove item when cantidad is negative', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);
    useCarritoStore.getState().actualizarCantidad('1', -3);

    expect(useCarritoStore.getState().items).toHaveLength(0);
  });

  it('should not affect other items when updating', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);
    useCarritoStore.getState().agregar(makePastel('2') as any);
    useCarritoStore.getState().actualizarCantidad('1', 10);

    const items = useCarritoStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].cantidad).toBe(10);
    expect(items[1].cantidad).toBe(1);
  });
});

describe('Carrito Store - mergeCarrito', () => {
  beforeEach(() => {
    localStorage.clear();
    useCarritoStore.setState({ items: [] });
  });

  it('should add all external items to empty cart', () => {
    const external = [
      { pastel: makePastel('1'), cantidad: 2 },
      { pastel: makePastel('2'), cantidad: 3 },
    ];

    useCarritoStore.getState().mergeCarrito(external);

    const items = useCarritoStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find(i => i.pastel._id === '1')?.cantidad).toBe(2);
    expect(items.find(i => i.pastel._id === '2')?.cantidad).toBe(3);
  });

  it('should add quantities when same pastel exists', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);
    useCarritoStore.getState().agregar(makePastel('1') as any);

    const external = [{ pastel: makePastel('1'), cantidad: 3 }];
    useCarritoStore.getState().mergeCarrito(external);

    const items = useCarritoStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(5); // 2 existing + 3 external
  });

  it('should append new pasteles and update existing ones', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);

    const external = [
      { pastel: makePastel('1'), cantidad: 1 },
      { pastel: makePastel('2'), cantidad: 4 },
    ];
    useCarritoStore.getState().mergeCarrito(external);

    const items = useCarritoStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find(i => i.pastel._id === '1')?.cantidad).toBe(2);
    expect(items.find(i => i.pastel._id === '2')?.cantidad).toBe(4);
  });

  it('should not change cart when external items is empty', () => {
    useCarritoStore.getState().agregar(makePastel('1') as any);

    useCarritoStore.getState().mergeCarrito([]);

    expect(useCarritoStore.getState().items).toHaveLength(1);
    expect(useCarritoStore.getState().items[0].cantidad).toBe(1);
  });

  it('should handle empty current cart with empty external items', () => {
    useCarritoStore.getState().mergeCarrito([]);

    expect(useCarritoStore.getState().items).toHaveLength(0);
  });
});
