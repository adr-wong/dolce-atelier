'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './pedido-detail.module.css';

interface PedidoItem {
  pastelId: string;
  nombre: string;
  precioSnapshot: number;
  cantidad: number;
}

interface Pedido {
  _id: string;
  clerkUserId: string;
  email: string;
  estado: string;
  total: number;
  items: PedidoItem[];
  metodoEntrega: 'DOMICILIO' | 'TIENDA';
  direccionEnvio?: string;
  telefono?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  PAGADO: '#3b82f6',
  PREPARANDO: '#8b5cf6',
  LISTO: '#06b6d4',
  EN_CAMINO: '#f97316',
  ENTREGADO: '#10b981',
  CANCELADO: '#ef4444',
};

const ESTADO_STEPS = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO'];

export default function PedidoDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pedidoId = params.id as string;

  useEffect(() => {
    async function fetchPedido() {
      try {
        const token = await getToken();
        if (!token) {
          setError('No autenticado');
          setLoading(false);
          return;
        }

        const res = await fetch(`${getApiUrl()}/api/pedidos/${pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('Pedido no encontrado');
          } else if (res.status === 403) {
            setError('No tienes acceso a este pedido');
          } else {
            setError('Error al cargar el pedido');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPedido(data.pedido || data);
      } catch (err) {
        console.error('Error fetching pedido:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    }

    if (pedidoId) {
      fetchPedido();
    }
  }, [pedidoId, getToken]);

  const getStepIndex = (estado: string) => {
    return ESTADO_STEPS.indexOf(estado);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando pedido...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/pedidos" className={styles.backLink}>
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Pedido no encontrado</h2>
          <Link href="/pedidos" className={styles.backLink}>
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(pedido.estado);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link href="/pedidos" className={styles.backBtn}>
          ← Volver a mis pedidos
        </Link>
        <h1 className={styles.title}>Detalle del Pedido</h1>
        <p className={styles.orderId}>#{pedido._id.slice(-8).toUpperCase()}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainInfo}>
          <div className={styles.statusCard}>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: ESTADO_COLORS[pedido.estado] || '#6b7280' }}
            >
              {pedido.estado.replace('_', ' ')}
            </div>
            <p className={styles.date}>
              Realizado el {formatDate(pedido.createdAt)}
            </p>
          </div>

          <div className={styles.trackingCard}>
            <h3 className={styles.cardTitle}>Seguimiento del Pedido</h3>
            <div className={styles.tracking}>
              {ESTADO_STEPS.map((step, index) => (
                <div 
                  key={step}
                  className={`${styles.trackingStep} ${
                    index <= currentStep ? styles.active : ''
                  } ${index === currentStep ? styles.current : ''}`}
                >
                  <div className={styles.stepDot}>
                    {index < currentStep ? '✓' : index === currentStep ? '●' : '○'}
                  </div>
                  <span className={styles.stepLabel}>
                    {step.replace('_', ' ')}
                  </span>
                  {index < ESTADO_STEPS.length - 1 && (
                    <div className={`${styles.stepLine} ${index < currentStep ? styles.activeLine : ''}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.itemsCard}>
            <h3 className={styles.cardTitle}>Productos</h3>
            <div className={styles.itemsList}>
              {pedido.items.map((item, index) => (
                <div key={index} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.nombre}</span>
                    <span className={styles.itemQty}>x{item.cantidad}</span>
                  </div>
                  <span className={styles.itemPrice}>
                    ${(item.precioSnapshot * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.total}>
              <span>Total</span>
              <span className={styles.totalAmount}>${pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className={styles.sideInfo}>
          <div className={styles.deliveryCard}>
            <h3 className={styles.cardTitle}>Método de Entrega</h3>
            <p className={styles.deliveryMethod}>
              {pedido.metodoEntrega === 'DOMICILIO' ? '🚚 Domicilio' : '🏪 Recoger en tienda'}
            </p>
            {pedido.direccionEnvio && (
              <p className={styles.address}>{pedido.direccionEnvio}</p>
            )}
          </div>

          <div className={styles.contactCard}>
            <h3 className={styles.cardTitle}>Datos de Contacto</h3>
            <p className={styles.contactEmail}>📧 {pedido.email}</p>
            {pedido.telefono && (
              <p className={styles.contactPhone}>📞 {pedido.telefono}</p>
            )}
          </div>

          {pedido.stripeSessionId && (
            <div className={styles.paymentCard}>
              <h3 className={styles.cardTitle}>Pago</h3>
              <p className={styles.paymentStatus}>✅ Pago confirmado</p>
              <p className={styles.paymentId}>
                ID: {pedido.stripeSessionId.slice(0, 20)}...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
