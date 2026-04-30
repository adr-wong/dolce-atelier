'use client';

import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function RecetasPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const containerStyle: React.CSSProperties = {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '1rem' : '2rem',
    textAlign: 'center',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: 500,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: isMobile ? '2rem' : '3rem',
    fontWeight: 400,
    color: '#E11D48',
    marginBottom: '0.5rem',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: 400,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  };

  const textStyle: React.CSSProperties = {
    color: '#666',
    fontSize: isMobile ? '1rem' : '1.1rem',
    lineHeight: 1.7,
    marginBottom: '2rem',
  };

  const textHighlightStyle: React.CSSProperties = {
    color: '#1a1a1a',
    fontWeight: 500,
    fontStyle: 'italic',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: '#E11D48',
    color: '#fff',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 500,
  };

  const linkStyle: React.CSSProperties = {
    color: '#E11D48',
    fontWeight: 500,
  };

  return (
    <main style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Próximamente</h1>
        <h2 style={subtitleStyle}>Recetas Personalizadas</h2>
        
        <p style={textStyle}>
          Estamos trabajando en una nueva experiencia para que puedas enviar nos tus 
          recetas personalizadas y convertir tus ideas en realidad.
        </p>
        
        <p style={textStyle}>
          <span style={textHighlightStyle}>
            ¡Te esperamos con ilusión para recibir tus solicitudes!
          </span>
        </p>
        
        <p style={textStyle}>
          Mientras tanto, puedes explorar nuestro{' '}
          <Link href="/catalogo" style={linkStyle}>
            catálogo de pasteles
          </Link>
          {' '}o ver tus{' '}
          <Link href="/pedidos" style={linkStyle}>
            pedidos anteriores
          </Link>
          .
        </p>
        
        <Link href="/catalogo" style={buttonStyle}>
          Ver Catálogo
        </Link>
      </div>
    </main>
  );
}