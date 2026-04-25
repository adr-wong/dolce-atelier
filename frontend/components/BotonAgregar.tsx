'use client';

import { useCarritoStore } from '@/store/carrito';
import type { Pastel } from '@/lib/types';

export function BotonAgregar({ pastel }: { pastel: Pastel }) {
  const agregar = useCarritoStore(s => s.agregar);

  return (
    <button
      onClick={() => agregar(pastel)}
      disabled={!pastel.disponible}
      style={{
        marginTop: '1.5rem',
        padding: '1rem 2rem',
        background: pastel.disponible ? '#e11d48' : '#ccc',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        cursor: pastel.disponible ? 'pointer' : 'not-allowed',
        width: '100%'
      }}
    >
      {pastel.disponible ? 'Agregar al Carrito' : 'Agotado'}
    </button>
  );
}