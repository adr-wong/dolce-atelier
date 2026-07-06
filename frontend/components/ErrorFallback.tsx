'use client';

import React from 'react';
import styles from './ErrorFallback.module.css';

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.card}>
        <div className={styles.icon}>⚠</div>
        <h2 className={styles.title}>Algo salió mal</h2>
        <p className={styles.message}>
          {error.message || 'Ocurrió un error inesperado. Por favor intentá de nuevo.'}
        </p>
        <button onClick={reset} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
