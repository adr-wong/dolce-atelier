'use client';

import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
