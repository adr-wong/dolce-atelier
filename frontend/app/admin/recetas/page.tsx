export default function AdminRecetas() {
  const recetas = [
    { id: 1, cliente: 'María García', fecha: '24/04/2026', estado: 'PENDIENTE' },
    { id: 2, cliente: 'Carlos López', fecha: '23/04/2026', estado: 'REVISANDO' },
    { id: 3, cliente: 'Ana Martínez', fecha: '22/04/2026', estado: 'COTIZADA' },
  ];

  const estadoColors: Record<string, string> = {
    'PENDIENTE': '#fef3c7',
    'REVISANDO': '#dbeafe',
    'COTIZADA': '#f3e8ff',
    'ACEPTADA': '#dcfce7',
    'RECHAZADA': '#fee2e2',
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Gestión de Recetas</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {recetas.map(receta => (
            <tr key={receta.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>#{receta.id}</td>
              <td style={{ padding: '1rem' }}>{receta.cliente}</td>
              <td style={{ padding: '1rem' }}>{receta.fecha}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  background: estadoColors[receta.estado],
                  color: '#374151'
                }}>
                  {receta.estado}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Revisar
                </button>
                <button style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cotizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}