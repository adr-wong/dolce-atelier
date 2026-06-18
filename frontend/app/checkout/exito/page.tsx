'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { SendReceiptRequest, PedidoItem } from '@/lib/types';
import styles from './exito.module.css';

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
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconCircle}>
          ✓
        </div>
        <h1 className={styles.title}>
          ¡Pedido Confirmado!
        </h1>
        <p className={styles.text}>
          Gracias por tu compra. Tu pedido ha sido recibido y está siendo preparado con cariño.
        </p>
        <div className={styles.orderBox}>
          <p className={styles.orderLabel}>
            Número de pedido
          </p>
          <p className={styles.orderId}>
            #{orderId ? orderId.toString().slice(-8) : 'Cargando...'}
          </p>
        </div>
        <p className={styles.emailNote}>
          Te hemos enviado un correo de confirmación. Puedes seguir el estado de tu pedido en tu historial.
        </p>
        <div className={styles.actions}>
          <Link href="/pedidos" className={styles.primaryBtn}>
            Ver Mis Pedidos
          </Link>
          <Link href="/catalogo" className={styles.secondaryBtn}>
            Seguir Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
