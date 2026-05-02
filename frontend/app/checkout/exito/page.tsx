'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { SendReceiptRequest, PedidoItem } from '@/lib/types';

export default function CheckoutExitoPage() {
  const searchParams = useSearchParams();
  const { getToken, userId } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderIdFromParams = searchParams.get('order_id');
    if (orderIdFromParams) {
      setOrderId(orderIdFromParams);
    }
  }, [searchParams]);

  useEffect(() => {
    const sendReceipt = async () => {
      let payload: SendReceiptRequest;

      if (orderId) {
        try {
          const token = await getToken();
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pedidos/${orderId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const order = data.pedido;

            payload = {
              customerEmail: "cliente@test.com",
              orderId: order._id,
              orderItems: order.items.map((item: PedidoItem) => ({
                name: item.nombre || `Pastel ${item.pastelId?.toString().slice(-4)}`,
                quantity: item.cantidad,
                price: item.precioSnapshot,
              })),
              total: order.total,
              customerName: userId || "Cliente",
            };
          } else {
            throw new Error('Failed to fetch order');
          }
        } catch (error) {
          console.error('Error fetching order, using mock data:', error);
          payload = {
            customerEmail: "cliente@test.com",
            orderId: orderId || "mock-order-123",
            orderItems: [{ name: "Pastel de Chocolate", quantity: 1, price: 25.99 }],
            total: 25.99,
            customerName: "Cliente de Prueba"
          };
        }
      } else {
        payload = {
          customerEmail: "cliente@test.com",
          orderId: "mock-order-123",
          orderItems: [{ name: "Pastel de Chocolate", quantity: 1, price: 25.99 }],
          total: 25.99,
          customerName: "Cliente de Prueba"
        };
      }

      try {
        const response = await fetch('/api/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log('Receipt email sent successfully');
        } else {
          console.error('Failed to send receipt email:', response.status);
        }
      } catch (error) {
        console.error('Error sending receipt email:', error);
      }
    };

    if (orderId) {
      sendReceipt();
    }
  }, [orderId, getToken, userId]);

  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 500 }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2.5rem'
        }}>
          ✓
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: 400,
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          ¡Pedido Confirmado!
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
          Gracias por tu compra. Tu pedido ha sido recibido y está siendo preparado con cariño.
        </p>
        <div style={{
          background: '#f9f9f9',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Número de pedido
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>
            #{orderId ? orderId.toString().slice(-8) : 'Cargando...'}
          </p>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2rem' }}>
          Te hemos enviado un correo de confirmación. Puedes seguir el estado de tu pedido en tu historial.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/pedidos"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#e11d48',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Ver Mis Pedidos
          </Link>
          <Link
            href="/catalogo"
            style={{
              padding: '0.875rem 1.5rem',
              background: '#fff',
              color: '#1a1a1a',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}