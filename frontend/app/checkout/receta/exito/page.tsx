'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ClerkOfflineError } from '@clerk/react/errors';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './receta-exito.module.css';

function RecetaExitoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const recetaId = searchParams.get('receta_id');
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId || !recetaId) {
      setStatus('error');
      setErrorMsg('Parametros de pago incompletos');
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    async function confirmarPago() {
      try {
        const token = await getToken();

        const res = await fetch(`${getApiUrl()}/api/recetas/${recetaId}/confirmar-pago`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json();
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(confirmarPago, 2000);
          } else {
            setStatus('error');
            setErrorMsg(data.error || 'Error confirmando el pago');
          }
        }
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(confirmarPago, 2000);
          } else {
            setStatus('error');
            setErrorMsg('Sin conexión a internet');
          }
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(confirmarPago, 2000);
          } else {
            setStatus('error');
            setErrorMsg('Error de conexion con el servidor');
          }
        }
      }
    }

    confirmarPago();
  }, [sessionId, recetaId, getToken]);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.iconLoading}>⏳</div>
            <h1 className={styles.title}>Confirmando pago...</h1>
            <p className={styles.message}>
              Estamos verificando tu pago con Stripe. Esto toma unos segundos.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.icon}>✓</div>
            <h1 className={styles.title}>¡Pago Exitoso!</h1>
            <p className={styles.message}>
              Tu receta personalizada ha sido confirmada y aceptada.
              Nuestro equipo comenzará a prepararla pronto.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.iconError}>!</div>
            <h1 className={styles.title}>Pago recibido</h1>
            <p className={styles.message}>
              Tu pago fue procesado por Stripe. Si no se actualiza automaticamente,
              verifica en &quot;Mis Recetas&quot; o contacta soporte.
            </p>
            {errorMsg && (
              <p className={styles.sessionId}>{errorMsg}</p>
            )}
          </>
        )}

        {sessionId && (
          <p className={styles.sessionId}>ID de transaccion: {sessionId.substring(0, 20)}...</p>
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
