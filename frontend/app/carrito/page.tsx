'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';

export default function CarritoPage() {
  const { items, actualizarCantidad, quitar, limpiar, total } = useCarritoStore();

  if (items.length === 0) {
    return (
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Tu Carrito está Vacío</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" style={{ padding: '1rem 2rem', background: '#e11d48', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tu Carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</h1>
        <button onClick={limpiar} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
          Vaciar carrito
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        <div>
          {items.map(({ pastel, cantidad }) => (
            <div key={pastel._id} style={{
              display: 'flex',
              gap: '1rem',
              padding: '1.5rem',
              background: '#fff',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '1px solid #eee'
            }}>
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{pastel.nombre}</h3>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>${pastel.precio} c/u</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad - 1)} style={{ padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                    <span style={{ padding: '0 1rem' }}>{cantidad}</span>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad + 1)} style={{ padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                  </div>
                  <button onClick={() => quitar(pastel._id)} style={{ color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>${(pastel.precio * cantidad).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem' }}>Resumen</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Envío</span>
            <span style={{ color: '#10b981' }}>Calculado en checkout</span>
          </div>
          <hr style={{ margin: '1rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <strong>Total</strong>
            <strong style={{ fontSize: '1.25rem' }}>${total().toFixed(2)}</strong>
          </div>
          <button style={{
            width: '100%',
            padding: '1rem',
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Proceder al Pago
          </button>
        </div>
      </div>
    </main>
  );
}