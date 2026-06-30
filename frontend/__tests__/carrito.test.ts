import { useCarritoStore } from '@/store/carrito';

// Mock localStorage
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

describe('Carrito Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCarritoStore.setState({ items: [] });
  });

  it('should add item to cart', () => {
    const pastel = {
      _id: '1',
      nombre: 'Chocolate',
      precio: 100,
      categoria: 'chocolate',
      imagen: 'test.jpg',
      disponible: true,
    };

    useCarritoStore.getState().agregar(pastel as any);
    const items = useCarritoStore.getState().items;
    
    expect(items).toHaveLength(1);
    expect(items[0].pastel._id).toBe('1');
    expect(items[0].cantidad).toBe(1);
  });

  it('should increase quantity when adding same item', () => {
    const pastel = {
      _id: '1',
      nombre: 'Chocolate',
      precio: 100,
      categoria: 'chocolate',
      imagen: 'test.jpg',
      disponible: true,
    };

    useCarritoStore.getState().agregar(pastel as any);
    useCarritoStore.getState().agregar(pastel as any);
    const items = useCarritoStore.getState().items;
    
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(2);
  });

  it('should remove item from cart', () => {
    const pastel = {
      _id: '1',
      nombre: 'Chocolate',
      precio: 100,
      categoria: 'chocolate',
      imagen: 'test.jpg',
      disponible: true,
    };

    useCarritoStore.getState().agregar(pastel as any);
    useCarritoStore.getState().quitar('1');
    const items = useCarritoStore.getState().items;
    
    expect(items).toHaveLength(0);
  });

  it('should calculate total correctly', () => {
    const pastel1 = {
      _id: '1',
      nombre: 'Chocolate',
      precio: 100,
      categoria: 'chocolate',
      imagen: 'test.jpg',
      disponible: true,
    };

    const pastel2 = {
      _id: '2',
      nombre: 'Vainilla',
      precio: 200,
      categoria: 'vainilla',
      imagen: 'test2.jpg',
      disponible: true,
    };

    useCarritoStore.getState().agregar(pastel1 as any);
    useCarritoStore.getState().agregar(pastel2 as any);
    useCarritoStore.getState().agregar(pastel2 as any);
    
    const total = useCarritoStore.getState().total();
    
    expect(total).toBe(500); // 100 + 200*2
  });

  it('should clear cart', () => {
    const pastel = {
      _id: '1',
      nombre: 'Chocolate',
      precio: 100,
      categoria: 'chocolate',
      imagen: 'test.jpg',
      disponible: true,
    };

    useCarritoStore.getState().agregar(pastel as any);
    useCarritoStore.getState().limpiar();
    const items = useCarritoStore.getState().items;
    
    expect(items).toHaveLength(0);
  });
});
