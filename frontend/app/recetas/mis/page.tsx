'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './mis-recetas.module.css';

interface Receta {
  _id: string;
  clerkUserId: string;
  nota: string;
  personas: number;
  archivoUrl?: string;
  estado: string;
  cotizacion: number | null;
  createdAt: string;
  updatedAt: string;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  REVISANDO: '#3b82f6',
  COTIZADA: '#8b5cf6',
  ACEPTADA: '#10b981',
  RECHAZADA: '#ef4444',
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  REVISANDO: 'En revisión',
  COTIZADA: 'Cotizada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

export default function MisRecetasPage() {
  const { getToken } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecetas() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${getApiUrl()}/api/recetas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setRecetas(data.recetas || []);
        }
      } catch (error) {
        console.error('Error fetching recetas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecetas();
  }, [getToken]);

  const handlePay = async (recetaId: string) => {
    try {
      setPayingId(recetaId);
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${getApiUrl()}/api/recetas/${recetaId}/aceptar-pagar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Error al procesar el pago');
        setPayingId(null);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
      setPayingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando tus recetas...</div>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Recetas</h1>
          <p className={styles.subtitle}>Recetas personalizadas que has enviado</p>
        </div>
        <Link href="/recetas" className={styles.newRecipeBtn}>
          + Nueva Receta
        </Link>
      </div>

      {recetas.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Aún no has enviado ninguna receta</p>
          <Link href="/recetas" className={styles.emptyBtn}>
            Enviar mi primera receta
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {recetas.map((receta) => (
            <div key={receta._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div 
                  className={styles.statusBadge}
                  style={{ backgroundColor: ESTADO_COLORS[receta.estado] || '#6b7280' }}
                >
                  {ESTADO_LABELS[receta.estado] || receta.estado}
                </div>
                <span className={styles.date}>{formatDate(receta.createdAt)}</span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.nota}>{receta.nota}</p>
                <div className={styles.meta}>
                  <span>👥 {receta.personas} personas</span>
                  {receta.archivoUrl && (
                    <a href={receta.archivoUrl} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                      📎 Archivo adjunto
                    </a>
                  )}
                </div>
              </div>

              {receta.cotizacion !== null && (
                <div className={styles.quoteSection}>
                  <div className={styles.quoteInfo}>
                    <span className={styles.quoteLabel}>Cotización:</span>
                    <span className={styles.quoteAmount}>${receta.cotizacion.toFixed(2)}</span>
                  </div>
                  {receta.estado === 'COTIZADA' && (
                    <button 
                      onClick={() => handlePay(receta._id)}
                      disabled={payingId === receta._id}
                      className={styles.payBtn}
                    >
                      {payingId === receta._id ? 'Procesando...' : 'Aceptar y Pagar'}
                    </button>
                  )}
                  {receta.estado === 'ACEPTADA' && (
                    <span className={styles.acceptedBadge}>✓ Aceptada - En preparación</span>
                  )}
                </div>
              )}

              {receta.estado === 'PENDIENTE' && (
                <div className={styles.pendingNote}>
                  ⏳ Esperando revisión de nuestro equipo
                </div>
              )}

              {receta.estado === 'REVISANDO' && (
                <div className={styles.reviewNote}>
                  🔍 Nuestro equipo está revisando tu solicitud
                </div>
              )}

              {receta.estado === 'RECHAZADA' && (
                <div className={styles.rejectedNote}>
                  ✗ Receta no aceptada. Contacta para más información.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
