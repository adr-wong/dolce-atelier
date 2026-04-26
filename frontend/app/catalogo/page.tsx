'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MOCK_PASTELES } from '@/lib/mock-data';
import { useCarritoStore } from '@/store/carrito';

const CATEGORIAS = ['todos', 'chocolate', 'vainilla', 'frutas'];

interface CatalogoPageProps {
  searchParams: { categoria?: string };
}

export default function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const categoria = searchParams.categoria || 'todos';
  const agregar = useCarritoStore(s => s.agregar);
  const items = useCarritoStore(s => s.items);
  
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  const pastelesFiltrados = categoria === 'todos'
    ? MOCK_PASTELES
    : MOCK_PASTELES.filter(p => p.categoria === categoria);

  const handleAgregar = (pastel: typeof MOCK_PASTELES[0]) => {
    agregar(pastel);
  };

  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: 1200,
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 250,
    background: '#f5f5f5',
  };

  const contentStyle: React.CSSProperties = {
    padding: '1.5rem',
  };

  const nombreStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
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
            href={cat === 'todos' ? '/catalogo' : `/catalogo?categoria=${cat}`}
            style={getTabStyle(categoria === cat || (cat === 'todos' && !categoria))}
          >
            {cat === 'todos' ? 'Todos' : cat}
          </Link>
        ))}
      </div>

      <div style={gridStyle}>
        {pastelesFiltrados.map(pastel => (
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
    </main>
  );
}