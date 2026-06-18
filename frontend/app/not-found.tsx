'use client';

import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.errorCode}>
          404
        </h1>
        <h2 className={styles.title}>
          Página No Encontrada
        </h2>
        <p className={styles.text}>
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className={styles.actions}>
          <Link
            href="/"
            className={styles.primaryBtn}
          >
            Volver al Inicio
          </Link>
          <Link
            href="/catalogo"
            className={styles.secondaryBtn}
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
