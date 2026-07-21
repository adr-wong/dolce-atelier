'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ClerkOfflineError } from '@clerk/react/errors';
import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { items, total } = useCarritoStore();
  const { getToken } = useAuth();
  const [metodoEntrega, setMetodoEntrega] = useState<'domicilio' | 'tienda'>('domicilio');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    direccion: '',
    referencias: '',
  });

  if (items.length === 0) {
    return (
      <main className={styles.emptyContainer}>
        <h1 className={styles.emptyTitle}>Tu Carrito está Vacío</h1>
        <p className={styles.emptyText}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" className={styles.emptyLink}>
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

      const body = {
        email: formData.email,
        items: items.map(({ pastel, cantidad }) => ({
          pastelId: pastel._id,
          cantidad,
        })),
        metodoEntrega: metodoEntrega === 'domicilio' ? 'DOMICILIO' : 'TIENDA',
        telefono: formData.telefono,
        ...(metodoEntrega === 'domicilio' && { direccionEnvio: formData.direccion }),
      };

      const response = await fetch(`${getApiUrl()}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.pedido?._id) {
        console.error('[Checkout] No pedido created in response', data);
        window.location.href = '/checkout/error';
        return;
      }

      const pagoRes = await fetch(`${getApiUrl()}/api/pedidos/${data.pedido._id}/pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const pagoData = await pagoRes.json();

      if (pagoData.checkoutUrl) {
        window.location.href = pagoData.checkoutUrl;
      } else {
        console.error('[Checkout] No checkout URL in payment response', pagoData);
        window.location.href = '/checkout/error';
      }
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error('[Checkout] Offline:', error);
        window.location.href = '/checkout/error?reason=offline';
      } else {
        console.error('[Checkout] Error during submission', error);
        window.location.href = '/checkout/error';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className={styles.container}>
      <div className={styles.backLinkWrapper}>
        <Link href="/pedidos" className={styles.backLink}>
          ← Mis Pedidos
        </Link>
      </div>
      <h1 className={styles.title}>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Datos de Contacto</h2>
              <div className={styles.inputGrid}>
                <div>
                  <label className={styles.label}>Correo electrónico</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@correo.com"
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Teléfono</label>
                  <input
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Método de Entrega</h2>
              <div className={styles.methodSelector}>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('domicilio')}
                  className={`${styles.methodBtn} ${metodoEntrega === 'domicilio' ? styles.methodBtnActive : styles.methodBtnInactive}`}
                >
                  <div className={styles.methodTitle}>📦 Envío a Domicilio</div>
                  <p className={styles.methodDesc}>Entrega en tu dirección</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('tienda')}
                  className={`${styles.methodBtn} ${metodoEntrega === 'tienda' ? styles.methodBtnActive : styles.methodBtnInactive}`}
                >
                  <div className={styles.methodTitle}>🏪 Retiro en Tienda</div>
                  <p className={styles.methodDesc}>Av. Principal #123</p>
                </button>
              </div>

              {metodoEntrega === 'domicilio' && (
                <div className={styles.inputGrid}>
                  <div className={styles.fullWidth}>
                    <label className={styles.label}>Dirección</label>
                    <input
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      required={metodoEntrega === 'domicilio'}
                      placeholder="Calle, número, colonia"
                      className={styles.input}
                    />
                  </div>
                  <div>
                    <label className={styles.label}>Referencias</label>
                    <input
                      name="referencias"
                      value={formData.referencias}
                      onChange={handleChange}
                      placeholder="Puerta, timbre, etc."
                      className={styles.input}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Resumen del Pedido</h3>
            <div className={styles.itemsList}>
              {items.map(({ pastel, cantidad }) => (
                <div key={pastel._id} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{pastel.nombre}</p>
                    <p className={styles.itemQty}>x{cantidad}</p>
                  </div>
                  <p className={styles.itemPrice}>${(pastel.precio * cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.muted}>Subtotal</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <div className={styles.summaryShipping}>
              <span className={styles.muted}>Envío</span>
              <span className={styles.green}>{metodoEntrega === 'tienda' ? 'Gratis' : 'Calculado'}</span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.summaryTotal}>
              <strong>Total</strong>
              <strong className={styles.totalAmount}>${total().toFixed(2)}</strong>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitBtn} ${loading ? styles.submitBtnDisabled : styles.submitBtnActive}`}
            >
              {loading ? 'Procesando...' : 'Pagar con Stripe'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}