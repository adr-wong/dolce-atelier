import Link from 'next/link';
import { MOCK_PASTELES } from '@/lib/mock-data';

export default function PedidosPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Mis Pedidos</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {MOCK_PASTELES.slice(0, 2).map((pastel, i) => (
          <div key={i} style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Pedido #{1000 + i}</p>
              <p style={{ fontWeight: 'bold' }}>{pastel.nombre}</p>
              <p style={{ color: '#666' }}>Fecha: 25/04/2026</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                background: i === 0 ? '#dcfce7' : '#fef9c3',
                color: i === 0 ? '#166534' : '#854d0e'
              }}>
                {i === 0 ? 'PAGADO' : 'PREPARANDO'}
              </span>
              <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>${pastel.precio}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/catalogo" style={{ color: '#e11d48' }}>
          ← Volver al catálogo
        </Link>
      </div>
    </main>
  );
}