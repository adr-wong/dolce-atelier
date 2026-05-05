'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const { getToken } = useAuth();

  useEffect(() => {
    async function cargarPedidos() {
      setLoading(true);
      setError(null);
      try {
        const params = filtroEstado ? `?estado=${filtroEstado}` : '';
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/pedidos${params}`, {
          credentials: 'include',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
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
        console.error('Error:', err);
        setError('Error al cargar pedidos');
      } finally {
        setLoading(false);
      }
    }
    cargarPedidos();
  }, [filtroEstado]);

  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: 800,
    margin: '0 auto',
    minHeight: '80vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    color: '#1a1a1a',
  };

  const filterStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: '0.9rem',
    cursor: 'pointer',
  };

  const pedidoCardStyle: React.CSSProperties = {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    background: '#fff',
  };

  const pedidoHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  };

  const pedidoIdStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: '#666',
  };

  const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
    const colores = ESTADOS_COLORES[estado] || ESTADOS_COLORES.PENDIENTE;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: colores.bg,
        color: colores.text,
      }}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const itemsStyle: React.CSSProperties = {
    borderTop: '1px solid #eee',
    paddingTop: '1rem',
    marginTop: '1rem',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
  };

  const totalStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
    fontWeight: 600,
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
      <main style={containerStyle}>
        <h1 style={titleStyle}>Mis Pedidos</h1>
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando pedidos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={containerStyle}>
        <h1 style={titleStyle}>Mis Pedidos</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
          {error.includes('sesión') && (
            <Link href="/sign-in" style={{ 
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#E11D48',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
            }}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Mis Pedidos</h1>
        <select 
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={filterStyle}
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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes pedidos aún.</p>
          <Link href="/catalogo" style={{ color: '#E11D48', textDecoration: 'underline' }}>
            Ver catálogo →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidos.map((pedido) => (
            <div key={pedido._id} style={pedidoCardStyle}>
              <div style={pedidoHeaderStyle}>
                <div>
                  <p style={pedidoIdStyle}>Pedido #{pedido._id.slice(-6).toUpperCase()}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>
                    {fecha(pedido.createdAt)} • {formatMetodo(pedido.metodoEntrega)}
                  </p>
                </div>
                <EstadoBadge estado={pedido.estado} />
              </div>

              <div style={itemsStyle}>
                {pedido.items.map((item, idx) => (
                  <div key={idx} style={itemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 500 }}>{item.nombre}</span>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>x{item.cantidad}</span>
                    </div>
                    <span style={{ fontWeight: 500 }}>
                      ${(item.precioSnapshot * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={totalStyle}>
                <span>Total</span>
                <span style={{ fontSize: '1.1rem', color: '#E11D48' }}>${pedido.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/catalogo" style={{ color: '#E11D48' }}>
          ← Volver al catálogo
        </Link>
      </div>
    </main>
  );
}