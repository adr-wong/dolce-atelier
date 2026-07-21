'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { ClerkOfflineError } from '@clerk/react/errors';
import styles from './pedidos.module.css';

import { getApiUrl } from '@/lib/get-api-url';

interface ItemPedido {
  pastelId: string;
  nombre: string;
  precioSnapshot: number;
  cantidad: number;
}

interface Pedido {
  _id: string;
  estado: string;
  total: number;
  items: ItemPedido[];
  metodoEntrega: string;
  direccionEnvio?: string;
  createdAt: string;
}

const ESTADOS_COLORES: Record<string, { bg: string; text: string }> = {
  PENDIENTE: { bg: '#fef9c3', text: '#854d0e' },
  PAGADO: { bg: '#dbeafe', text: '#1e40af' },
  PREPARANDO: { bg: '#fef9c3', text: '#854d0e' },
  LISTO: { bg: '#dcfce7', text: '#166534' },
  EN_CAMINO: { bg: '#e0e7ff', text: '#3730a3' },
  ENTREGADO: { bg: '#dcfce7', text: '#166534' },
  CANCELADO: { bg: '#fee2e2', text: '#991b1b' },
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [payingId, setPayingId] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    async function cargarPedidos() {
      setLoading(true);
      setError(null);
      try {
        const params = filtroEstado ? `?estado=${filtroEstado}` : '';
        const token = await getToken();
        const res = await fetch(`${getApiUrl()}/api/pedidos${params}`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            setError('Inicia sesión para ver tus pedidos');
            return;
          }
          throw new Error('Error al cargar pedidos');
        }
        
        const data = await res.json();
        setPedidos(data.pedidos || []);
      } catch (err) {
        if (ClerkOfflineError.is(err)) {
          console.error('Offline:', err);
          setError('Sin conexión a internet');
        } else {
          console.error('Error:', err);
          setError('Error al cargar pedidos');
        }
      } finally {
        setLoading(false);
      }
    }
    cargarPedidos();
  }, [filtroEstado]);

  const handlePagar = async (pedidoId: string) => {
    setPayingId(pedidoId);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/pedidos/${pedidoId}/pagar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'No se obtuvo URL de pago');
      }
    } catch (e) {
      setError('Error al crear sesión de pago');
    } finally {
      setPayingId(null);
    }
  };

  const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
    const colores = ESTADOS_COLORES[estado] || ESTADOS_COLORES.PENDIENTE;
    return (
      <span className={styles.estadoBadge} style={{
        background: colores.bg,
        color: colores.text,
      }}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const fecha = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMetodo = (metodo: string) => {
    return metodo === 'DOMICILIO' ? 'A domicilio' : 'Recoger en tienda';
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Mis Pedidos</h1>
        <p className={styles.loadingText}>Cargando pedidos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Mis Pedidos</h1>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          {error.includes('sesión') && (
            <Link href="/sign-in" className={styles.loginBtn}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Pedidos</h1>
        <select 
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={styles.filter}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADO">Pagado</option>
          <option value="PREPARANDO">Preparando</option>
          <option value="LISTO">Listo</option>
          <option value="EN_CAMINO">En camino</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {pedidos.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p className={styles.emptyText}>No tienes pedidos aún.</p>
          <Link href="/catalogo" className={styles.emptyLink}>
            Ver catálogo →
          </Link>
        </div>
      ) : (
        <div className={styles.pedidosList}>
          {pedidos.map((pedido) => (
            <div key={pedido._id} className={styles.pedidoCard}>
              <div className={styles.pedidoHeader}>
                <div>
                  <p className={styles.pedidoId}>Pedido #{pedido._id.slice(-6).toUpperCase()}</p>
                  <p className={styles.dateMeta}>
                    {fecha(pedido.createdAt)} • {formatMetodo(pedido.metodoEntrega)}
                  </p>
                </div>
                <EstadoBadge estado={pedido.estado} />
              </div>

              <div className={styles.itemsList}>
                {pedido.items.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
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

              <div className={styles.totalRow}>
                <span>Total</span>
                <div className={styles.totalActions}>
                  <span className={styles.totalAmount}>${pedido.total.toFixed(2)}</span>
                  {pedido.estado === 'PENDIENTE' && (
                    <button 
                      className={styles.payBtn}
                      onClick={() => handlePagar(pedido._id)}
                      disabled={payingId === pedido._id}
                    >
                      {payingId === pedido._id ? 'Creando link...' : 'Pagar ahora'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.backLink}>
        <Link href="/catalogo">
          ← Volver al catálogo
        </Link>
      </div>
    </main>
  );
}
