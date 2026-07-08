'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCarritoStore } from '@/store/carrito';

const STORAGE_KEY = 'dolce-carrito-anonimo';

export function useCartMerge() {
  const { isSignedIn } = useAuth();
  const { items, mergeCarrito } = useCarritoStore();
  const hasMerged = useRef(false);

  useEffect(() => {
    if (!isSignedIn) {
      // Guardar carrito actual cuando no está autenticado
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } else if (!hasMerged.current) {
      // Fusionar carrito al autenticarse solo si el carrito actual está vacío.
      // El carrito en localStorage persiste entre sesiones en el mismo navegador,
      // por lo que fusionar el copia anónima duplicaría los mismos items.
      const carritoAnonimo = localStorage.getItem(STORAGE_KEY);
      if (carritoAnonimo && items.length === 0) {
        try {
          const itemsAnonimos = JSON.parse(carritoAnonimo);
          if (itemsAnonimos.length > 0) {
            mergeCarrito(itemsAnonimos);
          }
        } catch (error) {
          console.error('Error merging cart:', error);
        }
        localStorage.removeItem(STORAGE_KEY);
      } else if (carritoAnonimo) {
        localStorage.removeItem(STORAGE_KEY);
      }
      hasMerged.current = true;
    }
  }, [isSignedIn, items, mergeCarrito]);
}
