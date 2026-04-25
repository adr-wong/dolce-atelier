import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonAgregar } from '@/components/BotonAgregar';
import type { Pastel } from '@/lib/types';

interface DetallePageProps {
  params: Promise<{ id: string }>;
}

async function obtenerPastel(id: string): Promise<Pastel | null> {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${url}/api/pasteles/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: DetallePageProps) {
  const { id } = await params;
  const pastel = await obtenerPastel(id);
  return {
    title: pastel ? `${pastel.nombre} | Dolce Atelier` : 'No encontrado | Dolce Atelier',
  };
}

export default async function DetallePage({ params }: DetallePageProps) {
  const { id } = await params;
  const pastel = await obtenerPastel(id);

  if (!pastel) {
    notFound();
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/catalogo" style={{ color: '#666' }}>← Volver al catálogo</Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ position: 'relative', height: 400, borderRadius: '8px', overflow: 'hidden' }}>
          <Image
            src={pastel.imagen}
            alt={pastel.nombre}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
        
        <div>
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            background: '#f3f4f6', 
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {pastel.categoria}
          </span>
          
          <h1 style={{ fontSize: '2rem', marginTop: '1rem' }}>{pastel.nombre}</h1>
          
          {pastel.descripcion && (
            <p style={{ color: '#666', marginTop: '1rem', lineHeight: 1.6 }}>
              {pastel.descripcion}
            </p>
          )}
          
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1.5rem' }}>
            ${pastel.precio.toFixed(2)}
          </p>
          
          <BotonAgregar pastel={pastel} />
        </div>
      </div>
    </main>
  );
}