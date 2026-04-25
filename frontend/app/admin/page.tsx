import { MOCK_PASTELES } from '@/lib/mock-data';

export default function AdminDashboard() {
  const stats = [
    { label: 'Pedidos Hoy', value: '12', color: '#3b82f6' },
    { label: 'Recetas Pendientes', value: '5', color: '#f59e0b' },
    { label: 'Productos', value: MOCK_PASTELES.length, color: '#10b981' },
    { label: 'Ingresos Mes', value: '$45,000', color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #eee'
          }}>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>{stat.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}