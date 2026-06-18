'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import styles from './carrito.module.css';

export default function CarritoPage() {
  const { items, actualizarCantidad, quitar, limpiar, total } = useCarritoStore();

  if (items.length === 0) {
    return (
      <main className={styles.emptyContainer}>
        <h1 className={styles.emptyTitle}>Tu Carrito está Vacío</h1>
        <p className={styles.emptyText}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" className={styles.emptyLink}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tu Carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</h1>
        <button onClick={limpiar} className={styles.clearBtn}>
          Vaciar carrito
        </button>
      </div>

      <div className={styles.grid}>
        <div>
          {items.map(({ pastel, cantidad }) => (
            <div key={pastel._id} className={styles.itemCard}>
              <div className={styles.itemImage}>
                <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{pastel.nombre}</h3>
                <p className={styles.itemPrice}>${pastel.precio} c/u</p>
                <div className={styles.controls}>
                  <div className={styles.quantityBox}>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad - 1)} className={styles.qtyBtn}>-</button>
                    <span className={styles.quantityValue}>{cantidad}</span>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad + 1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <button onClick={() => quitar(pastel._id)} className={styles.deleteBtn}>
                    Eliminar
                  </button>
                </div>
              </div>
              <div className={styles.itemTotal}>
                <p>${(pastel.precio * cantidad).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Resumen</h3>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span className={styles.shipping}>Calculado en checkout</span>
          </div>
          <hr className={styles.divider} />
          <div className={styles.totalRow}>
            <strong>Total</strong>
            <strong className={styles.totalAmount}>${total().toFixed(2)}</strong>
          </div>
          <Link href="/checkout" className={styles.checkoutBtn}>
            Proceder al Pago
          </Link>
        </div>
      </div>
    </main>
  );
}
