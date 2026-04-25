'use client';

import Image from 'next/image';
import type { Pastel } from '@/lib/types';
import { useCarritoStore } from '@/store/carrito';

interface TarjetaPastelProps {
  pastel: Pastel;
}

export default function TarjetaPastel({ pastel }: TarjetaPastelProps) {
  const agregar = useCarritoStore(s => s.agregar);

  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      <div style={{ position: 'relative', height: 200 }}>
        <Image
          src={pastel.imagen}
          alt={pastel.nombre}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '1rem' }}>
        <h3>{pastel.nombre}</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{pastel.categoria}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            ${pastel.precio.toFixed(2)}
          </span>
          <button
            onClick={() => agregar(pastel)}
            disabled={!pastel.disponible}
            style={{
              padding: '0.5rem 1rem',
              background: pastel.disponible ? '#e11d48' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: pastel.disponible ? 'pointer' : 'not-allowed'
            }}
          >
            {pastel.disponible ? 'Agregar' : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
}