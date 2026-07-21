'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCarritoStore } from '@/store/carrito';
import styles from './exito.module.css';

export default function CheckoutExitoContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const orderIdFromParams = searchParams.get('order_id');
    if (orderIdFromParams) {
      setOrderId(orderIdFromParams);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!orderId) return;
    const session_id = searchParams.get('session_id');
    if (!session_id) {
      setConfirming(false);
      return;
    }

    let cancelled = false;

    const confirmar = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/pedidos/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await res.json();
        if (data.pedido?.estado !== 'PAGADO') {
          await fetch(`/api/pedidos/${orderId}/confirmar-pago`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ session_id }),
          });
          return false;
        }
        return true;
      } catch (e) {
        console.error('[CHECKOUT-EXITO] Error verificando pago:', e);
        return false;
      }
    };

    const poll = async () => {
      while (!cancelled) {
        const paid = await confirmar();
        if (cancelled) return;
        if (paid) {
          setConfirming(false);
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    };

    poll();

    return () => { cancelled = true; };
  }, [orderId, searchParams, getToken]);

  useEffect(() => {
    if (confirming) return;
    console.log('[CHECKOUT-EXITO] Pedido confirmado. El email de confirmación será enviado por el webhook de Stripe.');
    useCarritoStore.getState().limpiar();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dolce-carrito-anonimo');
    }
  }, [confirming]);

  if (confirming) {
    return (
      <main className={styles.loadingContainer}>
        <div className={styles.content}>
          <div className={styles.spinner} />
          <h1 className={styles.title}>Confirmando pago...</h1>
          <p className={styles.text}>Esto solo tomará un momento.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconCircle}>
          ✓
        </div>
        <h1 className={styles.title}>
          ¡Pedido Confirmado!
        </h1>
        <p className={styles.text}>
          Gracias por tu compra. Tu pedido ha sido recibido y está siendo preparado con cariño.
        </p>
        <div className={styles.orderBox}>
          <p className={styles.orderLabel}>
            Número de pedido
          </p>
          <p className={styles.orderId}>
            #{orderId ? orderId.toString().slice(-8) : 'Cargando...'}
          </p>
        </div>
        <p className={styles.emailNote}>
          Te hemos enviado un correo de confirmación. Puedes seguir el estado de tu pedido en tu historial.
        </p>
        <div className={styles.actions}>
          <Link href="/pedidos" className={styles.primaryBtn}>
            Ver Mis Pedidos
          </Link>
          <Link href="/catalogo" className={styles.secondaryBtn}>
            Seguir Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
