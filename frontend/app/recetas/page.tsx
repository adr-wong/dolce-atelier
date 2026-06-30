'use client';

import Link from 'next/link';
import RecetaForm from '@/components/RecetaForm';
import styles from './recetas.module.css';

export default function RecetasPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Recetas Personalizadas</h1>
        <h2 className={styles.subtitle}>Cuéntanos tu idea y la haremos realidad</h2>
        
        <p className={styles.text}>
          Completa el formulario a continuación con los detalles de tu pastel personalizado.
          Nuestro equipo te enviará una cotización en menos de 24 horas.
        </p>
        
        <RecetaForm />
        
        <div className={styles.links}>
          <p className={styles.text}>
            También puedes explorar nuestro{' '}
            <Link href="/catalogo" className={styles.link}>
              catálogo de pasteles
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
