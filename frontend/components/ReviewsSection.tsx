'use client';

import { useEffect, useState } from 'react';
import StarRating from '@/components/StarRating';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './ReviewsSection.module.css';

interface Resena {
  _id: string;
  calificacion: number;
  resena: string;
  email: string;
  createdAt: string;
}

export default function ReviewsSection({ pastelNombre }: { pastelNombre: string }) {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${getApiUrl()}/api/pedidos?estado=ENTREGADO`);
        const data = await res.json();
        const pedidos = data.pedidos || [];
        // Filter reviews for this pastel
        const reviews: Resena[] = [];
        for (const p of pedidos) {
          if (p.calificacion && p.items?.some((item: any) => item.nombre === pastelNombre)) {
            reviews.push({
              _id: p._id,
              calificacion: p.calificacion,
              resena: p.resena || '',
              email: p.email || 'Anónimo',
              createdAt: p.updatedAt || p.createdAt,
            });
          }
        }
        setResenas(reviews);
      } catch {
        setResenas([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pastelNombre]);

  if (loading) return <p className={styles.loading}>Cargando reseñas...</p>;
  if (resenas.length === 0) return <p className={styles.empty}>Sin reseñas aún. ¡Sé el primero en calificar!</p>;

  const promedio = resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length;

  return (
    <section className={styles.section} aria-label="Reseñas de clientes">
      <h3 className={styles.title}>Reseñas</h3>
      <div className={styles.avgRow}>
        <StarRating rating={Math.round(promedio)} size="md" />
        <span className={styles.avg}>{promedio.toFixed(1)} ({resenas.length})</span>
      </div>
      <div className={styles.list}>
        {resenas.map(r => (
          <div key={r._id} className={styles.review}>
            <div className={styles.header}>
              <StarRating rating={r.calificacion} size="sm" />
              <span className={styles.author}>{r.email.split('@')[0]}</span>
              <span className={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.resena && <p className={styles.text}>{r.resena}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
