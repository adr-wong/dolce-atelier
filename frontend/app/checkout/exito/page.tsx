'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutExitoPage() {
  const [pedidoId, setPedidoId] = useState<string>('');

  useEffect(() => {
    setPedidoId(Date.now().toString().slice(-8));
  }, []);

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
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2.5rem'
        }}>
          ✓
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: 400,
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          ¡Pedido Confirmado!
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
          Gracias por tu compra. Tu pedido ha sido recibido y está siendo preparado con cariño.
        </p>
        <div style={{
          background: '#f9f9f9',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Número de pedido
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>
            #{pedidoId || '-------'}
          </p>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2rem' }}>
          Te hemos enviado un correo de confirmación. Puedes seguir el estado de tu pedido en tu historial.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/pedidos"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#e11d48',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Ver Mis Pedidos
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
            Seguir Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}