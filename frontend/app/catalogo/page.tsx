'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useTransition } from 'react';
import { useCarritoStore } from '@/store/carrito';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORIAS = ['todos', 'chocolate', 'vainilla', 'frutas', 'especial'];

interface Pastel {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: string;
  disponible: boolean;
}

interface CatalogoDatos {
  pasteles: Pastel[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CatalogoPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoria = searchParams.get('categoria') || 'todos';
  const page = parseInt(searchParams.get('page') || '1');
  
  const agregar = useCarritoStore(s => s.agregar);
  const items = useCarritoStore(s => s.items);
  const [datos, setDatos] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    async function cargarPasteles() {
      setLoading(true);
      try {
        const catParam = categoria !== 'todos' ? `&categoria=${categoria}` : '';
        const res = await fetch(`${API_URL}/api/pasteles?page=${page}&limit=12${catParam}`);
        const data = await res.json();
        setDatos(data);
      } catch (error) {
        console.error('Error cargando pasteles:', error);
        setDatos({ pasteles: [], total: 0, page: 1, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    }
    cargarPasteles();
  }, [categoria, page]);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  const getPastelesFiltrados = () => {
    if (!datos || !datos.pasteles) return [];
    return datos.pasteles.filter((p: any) => p.disponible);
  };

  const handleAgregar = (pastel: Pastel) => {
    agregar(pastel);
  };

  const cambiarPagina = (nuevaPagina: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', nuevaPagina.toString());
      router.push(`/catalogo?${params.toString()}`);
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: isMobile ? '1rem' : '2rem',
    maxWidth: 1200,
    margin: '0 auto',
    opacity: isPending ? 0.5 : 1,
    transition: 'opacity 0.3s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '1rem' : '0',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    color: '#1a1a1a',
  };

  const cartLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: '#E11D48',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 500,
    position: 'relative',
  };

  const cartBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -8,
    right: -8,
    background: '#fff',
    color: '#E11D48',
    fontSize: '0.75rem',
    fontWeight: 600,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    background: isActive ? '#e11d48' : '#fff',
    color: isActive ? '#fff' : '#333',
    border: '1px solid #ddd',
    textDecoration: 'none',
    textTransform: 'capitalize' as const,
    fontWeight: 500,
  });

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    animation: 'fadeIn 0.4s ease-out forwards',
    opacity: 0,
    animationDelay: '0.1s',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: isMobile ? '1rem' : '2rem',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: isMobile ? 200 : 250,
    background: '#f5f5f5',
  };

  const contentStyle: React.CSSProperties = {
    padding: '1.5rem',
  };

  const nombreStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.25rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  };

  const descripcionStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1rem',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const precioStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#E11D48',
  };

  const addButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: '#E11D48',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
  };

  return (
    <main style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Nuestro Catálogo</h1>
        <Link href="/carrito" style={cartLinkStyle}>
          🛒 Carrito
          {totalItems > 0 && <span style={cartBadgeStyle}>{totalItems}</span>}
        </Link>
      </div>

      <div style={tabsContainerStyle}>
        {CATEGORIAS.map(cat => (
          <Link
            key={cat}
            href={cat === 'todos' ? '/catalogo?page=1' : `/catalogo?categoria=${cat}&page=1`}
            style={getTabStyle(categoria === cat || (cat === 'todos' && !categoria))}
          >
            {cat === 'todos' ? 'Todos' : cat}
          </Link>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Cargando pasteles...</p>
        </div>
      ) : getPastelesFiltrados().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>No hay pasteles disponibles en esta categoría.</p>
        </div>
      ) : (
      <div style={gridStyle}>
        {getPastelesFiltrados().map(pastel => (
          <div key={pastel._id} style={cardStyle}>
            <div style={imageContainerStyle}>
              <Image
                src={pastel.imagen}
                alt={pastel.nombre}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div style={contentStyle}>
              <h3 style={nombreStyle}>{pastel.nombre}</h3>
              <p style={descripcionStyle}>{pastel.descripcion}</p>
              <div style={actionsStyle}>
                <span style={precioStyle}>${pastel.precio}</span>
                <button 
                  onClick={() => handleAgregar(pastel)}
                  style={addButtonStyle}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      
      {datos && datos.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          {Array.from({ length: datos.totalPages || 0 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => cambiarPagina(num)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                background: datos && datos.page === num ? '#E11D48' : '#fff',
                color: datos && datos.page === num ? '#fff' : '#333',
                cursor: 'pointer',
              }}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}