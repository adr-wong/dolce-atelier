'use client';

import Link from 'next/link';
import styles from './recetas.module.css';

export default function RecetasPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Próximamente</h1>
        <h2 className={styles.subtitle}>Recetas Personalizadas</h2>
        
        <p className={styles.text}>
          Estamos trabajando en una nueva experiencia para que puedas enviar nos tus 
          recetas personalizadas y convertir tus ideas en realidad.
        </p>
        
        <p className={styles.text}>
          <span className={styles.textHighlight}>
            ¡Te esperamos con ilusión para recibir tus solicitudes!
          </span>
        </p>
        
        <p className={styles.text}>
          Mientras tanto, puedes explorar nuestro{' '}
          <Link href="/catalogo" className={styles.link}>
            catálogo de pasteles
          </Link>
          {' '}o ver tus{' '}
          <Link href="/pedidos" className={styles.link}>
            pedidos anteriores
          </Link>
          .
        </p>
        
        <Link href="/catalogo" className={styles.button}>
          Ver Catálogo
        </Link>
      </div>
    </main>
  );
}
