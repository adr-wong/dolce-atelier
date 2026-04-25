import { Suspense } from 'react';
import type { Pastel } from '@/lib/types';
import TarjetaPastel from '@/components/TarjetaPastel';

const CATEGORIAS = ['todos', 'chocolate', 'vainilla', 'frutas', 'personalizado'];

interface CatalogoPageProps {
  searchParams: Promise<{ categoria?: string }>;
}

async function obtenerPasteles(categoria?: string): Promise<Pastel[]> {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const endpoint = categoria && categoria !== 'todos'
    ? `/api/pasteles?categoria=${categoria}`
    : '/api/pasteles';
  
  try {
    const res = await fetch(`${url}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.pasteles || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ searchParams }: CatalogoPageProps) {
  const params = await searchParams;
  return {
    title: params.categoria 
      ? `${params.categoria} | Dolce Atelier`
      : 'Catálogo | Dolce Atelier',
  };
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const params = await searchParams;
  const categoria = params.categoria || 'todos';
  const pasteles = await obtenerPasteles(categoria);

  return (
    <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Nuestro Catálogo</h1>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {CATEGORIAS.map(cat => (
          <a
            key={cat}
            href={cat === 'todos' ? '/catalogo' : `/catalogo?categoria=${cat}`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              background: categoria === cat || (cat === 'todos' && !categoria) ? '#e11d48' : '#fff',
              color: categoria === cat || (cat === 'todos' && !categoria) ? '#fff' : '#333',
              border: '1px solid #ddd',
              textTransform: 'capitalize'
            }}
          >
            {cat}
          </a>
        ))}
      </div>

      <Suspense fallback={<p>Cargando...</p>}>
        {pasteles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            No hay pasteles disponibles en esta categoría.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {pasteles.map(pastel => (
              <TarjetaPastel key={pastel._id} pastel={pastel} />
            ))}
          </div>
        )}
      </Suspense>
    </main>
  );
}