jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/store/carrito', () => ({
  useCarritoStore: jest.fn(),
}));

import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCarritoStore } from '@/store/carrito';
import { useCartMerge } from '@/hooks/useCartMerge';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STORAGE_KEY = 'dolce-carrito-anonimo';
const mergeCarrito = jest.fn();
const useAuthMock = useAuth as jest.Mock;
const useStoreMock = useCarritoStore as jest.Mock;

function renderHook(callback: () => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root!: Root;
  const TestComponent = () => {
    callback();
    return null;
  };
  act(() => {
    root = createRoot(container);
    root.render(createElement(TestComponent));
  });
  const unmount = () => {
    act(() => root.unmount());
    container.remove();
  };
  return { unmount };
}

const anonCart = [{ pastel: { _id: '9', nombre: 'X', precio: 1, categoria: 'c', imagen: 'i', disponible: true }, cantidad: 2 }];
const signedInItems = [{ pastel: { _id: '1', nombre: 'Y', precio: 1, categoria: 'c', imagen: 'i', disponible: true }, cantidad: 1 }];

describe('useCartMerge', () => {
  beforeEach(() => {
    mergeCarrito.mockClear();
    localStorage.clear();
    useAuthMock.mockReturnValue({ isSignedIn: false });
    useStoreMock.mockReturnValue({ items: [], mergeCarrito });
  });

  it('persists the cart to localStorage when not signed in and cart is non-empty', () => {
    useStoreMock.mockReturnValue({ items: signedInItems, mergeCarrito });

    renderHook(() => useCartMerge());

    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(signedInItems));
    expect(mergeCarrito).not.toHaveBeenCalled();
  });

  it('does NOT write to localStorage when not signed in and cart is empty', () => {
    renderHook(() => useCartMerge());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('merges the anonymous cart when signing in with an empty cart', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anonCart));
    useAuthMock.mockReturnValue({ isSignedIn: true });
    useStoreMock.mockReturnValue({ items: [], mergeCarrito });

    renderHook(() => useCartMerge());

    expect(mergeCarrito).toHaveBeenCalledWith(anonCart);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('removes the anonymous cart and does NOT merge when signing in with a non-empty cart', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anonCart));
    useAuthMock.mockReturnValue({ isSignedIn: true });
    useStoreMock.mockReturnValue({ items: signedInItems, mergeCarrito });

    renderHook(() => useCartMerge());

    expect(mergeCarrito).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores a corrupt anonymous cart (caught) and still removes it', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    useAuthMock.mockReturnValue({ isSignedIn: true });
    useStoreMock.mockReturnValue({ items: [], mergeCarrito });

    renderHook(() => useCartMerge());

    expect(mergeCarrito).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    errorSpy.mockRestore();
  });

  it('does nothing when signed in, cart empty and no anonymous cart exists', () => {
    useAuthMock.mockReturnValue({ isSignedIn: true });
    useStoreMock.mockReturnValue({ items: [], mergeCarrito });

    renderHook(() => useCartMerge());

    expect(mergeCarrito).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
