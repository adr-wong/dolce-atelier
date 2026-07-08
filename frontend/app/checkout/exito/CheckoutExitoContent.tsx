'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCarritoStore } from '@/store/carrito';
import styles from './exito.module.css';

export default function CheckoutExitoContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderIdFromParams = searchParams.get('order_id');
    if (orderIdFromParams) {
      setOrderId(orderIdFromParams);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('[CHECKOUT-EXITO] Pedido confirmado. El email de confirmación será enviado por el webhook de Stripe.');
    useCarritoStore.getState().limpiar();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dolce-carrito-anonimo');
    }
  }, [orderId]);

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
