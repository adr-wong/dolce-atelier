import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarritoItem, Pastel } from '@/lib/types';

interface CarritoState {
  items: CarritoItem[];
  agregar: (pastel: Pastel) => void;
  quitar: (pastelId: string) => void;
  actualizarCantidad: (pastelId: string, cantidad: number) => void;
  limpiar: () => void;
  total: () => number;
  mergeCarrito: (itemsExteriores: CarritoItem[]) => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (pastel) => {
        const items = get().items;
        const existente = items.find(i => i.pastel._id === pastel._id);
        if (existente) {
          set({
            items: items.map(i =>
              i.pastel._id === pastel._id
                ? { ...i, cantidad: i.cantidad + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { pastel, cantidad: 1 }] });
        }
      },
      quitar: (pastelId) => {
        set({ items: get().items.filter(i => i.pastel._id !== pastelId) });
      },
      actualizarCantidad: (pastelId, cantidad) => {
        if (cantidad <= 0) {
          get().quitar(pastelId);
          return;
        }
        set({
          items: get().items.map(i =>
            i.pastel._id === pastelId ? { ...i, cantidad } : i
          ),
        });
      },
      limpiar: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.pastel.precio * i.cantidad, 0),
      mergeCarrito: (itemsExteriores) => {
        const itemsActuales = get().items;
        const itemsMergeados = [...itemsActuales];
        
        itemsExteriores.forEach(itemExterno => {
          const existente = itemsMergeados.find(
            i => i.pastel._id === itemExterno.pastel._id
          );
          if (existente) {
            existente.cantidad += itemExterno.cantidad;
          } else {
            itemsMergeados.push(itemExterno);
          }
        });
        
        set({ items: itemsMergeados });
      },
    }),
    { name: 'dolce-carrito' }
  )
);