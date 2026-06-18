'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './error.module.css';

export default function CheckoutErrorPage() {
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    setErrorId(Date.now().toString().slice(-8));
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconCircle}>
          ✕
        </div>
        <h1 className={styles.title}>
          Algo Salió Mal
        </h1>
        <p className={styles.text}>
          Lo sentimos, no pudimos procesar tu pago. Por favor intenta de nuevo o contacta soporte.
        </p>
        <div className={styles.errorBox}>
          <p className={styles.errorLabel}>
            Si el problema persiste, contacta soporte con este ID:
          </p>
          <p className={styles.errorId}>
            ERR-{errorId || 'CARGANDO...'}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/carrito" className={styles.primaryBtn}>
            Reintentar Pago
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
