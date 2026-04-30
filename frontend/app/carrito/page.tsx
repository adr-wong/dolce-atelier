'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function CarritoPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { items, actualizarCantidad, quitar, limpiar, total } = useCarritoStore();

  if (items.length === 0) {
    return (
      <main style={{ padding: isMobile ? '6rem 1rem' : '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Tu Carrito está Vacío</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" style={{ padding: '1rem 2rem', background: '#e11d48', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  const emptyStyle: React.CSSProperties = {
    padding: isMobile ? '3rem 1rem' : '4rem 2rem',
    textAlign: 'center',
  };

  const containerStyle: React.CSSProperties = {
    padding: isMobile ? '1rem' : '2rem',
    maxWidth: 1000,
    margin: '0 auto',
    paddingTop: isMobile ? '6rem' : '4rem',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '1rem' : '0',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: isMobile ? '1.5rem' : '2rem',
  };

  const clearBtnStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
    gap: isMobile ? '1.5rem' : '2rem',
  };

  const itemCardStyle: React.CSSProperties = {
    display: 'flex',
    gap: isMobile ? '0.75rem' : '1rem',
    padding: isMobile ? '1rem' : '1.5rem',
    background: '#fff',
    borderRadius: '12px',
    marginBottom: isMobile ? '0.75rem' : '1rem',
    border: '1px solid #eee',
    flexDirection: isMobile ? 'column' : 'row',
  };

  const imageStyle: React.CSSProperties = {
    position: 'relative',
    width: isMobile ? '100%' : 100,
    height: isMobile ? 150 : 100,
  };

  const itemInfoStyle: React.CSSProperties = {
    flex: 1,
  };

  const itemNameStyle: React.CSSProperties = {
    marginBottom: '0.5rem',
    fontWeight: 500,
  };

  const itemPriceStyle: React.CSSProperties = {
    color: '#666',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const quantityBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    borderRadius: '6px',
  };

  const qtyBtnStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  };

  const deleteBtnStyle: React.CSSProperties = {
    color: '#e11d48',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  };

  const itemTotalStyle: React.CSSProperties = {
    textAlign: isMobile ? 'left' : 'right',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  };

  const summaryStyle: React.CSSProperties = {
    background: '#f9f9f9',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: '12px',
    height: 'fit-content',
  };

  const summaryTitleStyle: React.CSSProperties = {
    marginBottom: '1rem',
    fontFamily: 'Georgia, serif',
  };

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };

  const shippingStyle: React.CSSProperties = {
    color: '#10b981',
  };

  const totalRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  };

  const totalAmountStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  };

  const checkoutBtnStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '1rem',
    background: '#e11d48',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
  };

  return (
    <main style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Tu Carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</h1>
        <button onClick={limpiar} style={clearBtnStyle}>
          Vaciar carrito
        </button>
      </div>

      <div style={gridStyle}>
        <div>
          {items.map(({ pastel, cantidad }) => (
            <div key={pastel._id} style={itemCardStyle}>
              <div style={imageStyle}>
                <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div style={itemInfoStyle}>
                <h3 style={itemNameStyle}>{pastel.nombre}</h3>
                <p style={itemPriceStyle}>${pastel.precio} c/u</p>
                <div style={controlsStyle}>
                  <div style={quantityBoxStyle}>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad - 1)} style={qtyBtnStyle}>-</button>
                    <span style={{ padding: '0 1rem' }}>{cantidad}</span>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad + 1)} style={qtyBtnStyle}>+</button>
                  </div>
                  <button onClick={() => quitar(pastel._id)} style={deleteBtnStyle}>
                    Eliminar
                  </button>
                </div>
              </div>
              <div style={itemTotalStyle}>
                <p>${(pastel.precio * cantidad).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={summaryStyle}>
          <h3 style={summaryTitleStyle}>Resumen</h3>
          <div style={summaryRowStyle}>
            <span>Subtotal</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Envío</span>
            <span style={shippingStyle}>Calculado en checkout</span>
          </div>
          <hr style={{ margin: '1rem 0' }} />
          <div style={totalRowStyle}>
            <strong>Total</strong>
            <strong style={totalAmountStyle}>${total().toFixed(2)}</strong>
          </div>
          <Link href="/checkout" style={checkoutBtnStyle}>
            Proceder al Pago
          </Link>
        </div>
      </div>
    </main>
  );
}