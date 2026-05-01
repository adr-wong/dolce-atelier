'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 500 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '8rem',
          fontWeight: 200,
          marginBottom: '0',
          color: '#e11d48',
          lineHeight: 1
        }}>
          404
        </h1>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.5rem',
          fontWeight: 400,
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          Página No Encontrada
        </h2>
        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#e11d48',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Volver al Inicio
          </Link>
          <Link
            href="/catalogo"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#fff',
              color: '#1a1a1a',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}