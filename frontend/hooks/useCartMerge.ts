'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCarritoStore } from '@/store/carrito';
import { getApiUrl } from '@/lib/get-api-url';

const STORAGE_KEY = 'dolce-carrito-anonimo';

export function useCartMerge() {
  const { isSignedIn, getToken } = useAuth();
  const { items, mergeCarrito, setItems } = useCarritoStore();
  const hasMerged = useRef(false);
  const lastSavedRef = useRef<string>('');

  // HU-019: Guardar carrito en backend cuando cambia (cross-device)
  useEffect(() => {
    if (!isSignedIn || items.length === 0) return;
    const json = JSON.stringify(items);
    if (json === lastSavedRef.current) return;
    lastSavedRef.current = json;

    const save = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${getApiUrl()}/api/carrito`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: json,
        });
      } catch { /* silencioso */ }
    };
    save();
  }, [items, isSignedIn, getToken]);

  useEffect(() => {
    if (!isSignedIn) {
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } else if (!hasMerged.current) {
      hasMerged.current = true;

      const merge = async () => {
        // Fusionar carrito anónimo local
        const carritoAnonimo = localStorage.getItem(STORAGE_KEY);
        if (carritoAnonimo) {
          try {
            const itemsAnonimos = JSON.parse(carritoAnonimo);
            if (itemsAnonimos.length > 0) mergeCarrito(itemsAnonimos);
          } catch { /* ignore */ }
          localStorage.removeItem(STORAGE_KEY);
        }

        // HU-019: Cargar carrito guardado del backend
        try {
          const token = await getToken();
          if (!token) return;
          const res = await fetch(`${getApiUrl()}/api/carrito`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items?.length > 0) {
              setItems(data.items);
            }
          }
        } catch { /* silencioso */ }
      };
      merge();
    }
  }, [isSignedIn]);
}
