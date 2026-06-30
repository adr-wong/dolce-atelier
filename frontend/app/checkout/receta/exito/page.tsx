'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './receta-exito.module.css';

function RecetaExitoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>✓</div>
        <h1 className={styles.title}>¡Pago Exitoso!</h1>
        <p className={styles.message}>
          Tu receta personalizada ha sido confirmada y aceptada.
          Nuestro equipo comenzará a prepararla pronto.
        </p>
        {sessionId && (
          <p className={styles.sessionId}>ID de transacción: {sessionId.substring(0, 20)}...</p>
        )}
        <div className={styles.actions}>
          <Link href="/recetas/mis" className={styles.primaryBtn}>
            Ver Mis Recetas
          </Link>
          <Link href="/catalogo" className={styles.secondaryBtn}>
            Seguir Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RecetaExitoPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.loading}>Cargando...</div></div>}>
      <RecetaExitoContent />
    </Suspense>
  );
}
