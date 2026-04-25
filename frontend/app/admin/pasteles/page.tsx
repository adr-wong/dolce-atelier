import { MOCK_PASTELES } from '@/lib/mock-data';

export default function AdminPasteles() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestión de Pasteles</h1>
        <button style={{
          padding: '0.75rem 1.5rem',
          background: '#e11d48',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          + Nuevo Pastel
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Categoría</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Precio</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_PASTELES.map(pastel => (
            <tr key={pastel._id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>{pastel.nombre}</td>
              <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{pastel.categoria}</td>
              <td style={{ padding: '1rem' }}>${pastel.precio}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  background: pastel.disponible ? '#dcfce7' : '#fee2e2',
                  color: pastel.disponible ? '#166534' : '#991b1b'
                }}>
                  {pastel.disponible ? 'Activo' : 'Agotado'}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <button style={{ marginRight: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ✏️
                </button>
                <button style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}