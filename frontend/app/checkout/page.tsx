'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function CheckoutPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { items, total } = useCarritoStore();
  const { getToken } = useAuth();
  const [metodoEntrega, setMetodoEntrega] = useState<'domicilio' | 'tienda'>('domicilio');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefono: '',
    direccion: '',
    referencias: '',
  });

  if (items.length === 0) {
    return (
      <main style={{ padding: isMobile ? '6rem 1rem' : '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Tu Carrito está Vacío</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" style={{ padding: '1rem 2rem', background: '#e11d48', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        window.location.href = '/checkout/error?reason=no_token';
        return;
      }

      const body = {
        items: items.map(({ pastel, cantidad }) => ({
          pastelId: pastel._id,
          cantidad,
        })),
        metodoEntrega: metodoEntrega === 'domicilio' ? 'DOMICILIO' : 'TIENDA',
        telefono: formData.telefono,
        ...(metodoEntrega === 'domicilio' && { direccionEnvio: formData.direccion }),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = '/checkout/error';
      }
    } catch {
      window.location.href = '/checkout/error';
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: 1100, margin: '0 auto', paddingTop: isMobile ? '6rem' : '4rem' }}>
      <h1 style={{ marginBottom: '2rem', fontFamily: 'Georgia, serif', fontSize: isMobile ? '1.5rem' : '2rem' }}>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? '1.5rem' : '3rem' }}>
          <div>
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>Datos de Contacto</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Teléfono</label>
                  <input
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>Método de Entrega</h2>
              <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', marginBottom: '1.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('domicilio')}
                  style={{
                    flex: 1,
                    padding: isMobile ? '1rem' : '1.5rem',
                    border: `2px solid ${metodoEntrega === 'domicilio' ? '#e11d48' : '#ddd'}`,
                    borderRadius: '12px',
                    background: metodoEntrega === 'domicilio' ? '#fdf5f7' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 500 }}>📦 Envío a Domicilio</div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Entrega en tu dirección</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('tienda')}
                  style={{
                    flex: 1,
                    padding: isMobile ? '1rem' : '1.5rem',
                    border: `2px solid ${metodoEntrega === 'tienda' ? '#e11d48' : '#ddd'}`,
                    borderRadius: '12px',
                    background: metodoEntrega === 'tienda' ? '#fdf5f7' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 500 }}>🏪 Retiro en Tienda</div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Av. Principal #123</p>
                </button>
              </div>

              {metodoEntrega === 'domicilio' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Dirección</label>
                    <input
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      required={metodoEntrega === 'domicilio'}
                      placeholder="Calle, número, colonia"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Referencias</label>
                    <input
                      name="referencias"
                      value={formData.referencias}
                      onChange={handleChange}
                      placeholder="Puerta, timbre, etc."
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div style={{ background: '#f9f9f9', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Resumen del Pedido</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {items.map(({ pastel, cantidad }) => (
                <div key={pastel._id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '8px', overflow: 'hidden' }}>
                    <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{pastel.nombre}</p>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>x{cantidad}</p>
                  </div>
                  <p style={{ fontWeight: 500 }}>${(pastel.precio * cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#666' }}>Subtotal</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#666' }}>Envío</span>
              <span style={{ color: '#10b981' }}>{metodoEntrega === 'tienda' ? 'Gratis' : 'Calculado'}</span>
            </div>
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <strong>Total</strong>
              <strong style={{ fontSize: '1.25rem' }}>${total().toFixed(2)}</strong>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#ccc' : '#e11d48',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Procesando...' : 'Pagar con Stripe'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}