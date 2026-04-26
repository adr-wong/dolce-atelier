'use client';

import Link from 'next/link';

export default function CheckoutErrorPage() {
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
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2.5rem'
        }}>
          ✕
        </div>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '2rem',
          fontWeight: 400,
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          Algo Salió Mal
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
          Lo sentimos, no pudimos procesar tu pago. Por favor intenta de nuevo o contacta soporte.
        </p>
        <div style={{
          background: '#f9f9f9',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Si el problema persiste, contacta soporte con este ID:
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#666', marginTop: '0.5rem' }}>
            ERR-{Date.now().toString().slice(-8)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/carrito"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#e11d48',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Reintentar Pago
          </Link>
          <Link
            href="/"
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
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}