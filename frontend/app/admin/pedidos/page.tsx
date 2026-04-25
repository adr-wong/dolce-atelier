import { MOCK_PASTELES } from '@/lib/mock-data';

export default function AdminPedidos() {
  const pedidos = MOCK_PASTELES.slice(0, 4).map((p, i) => ({
    id: 1000 + i,
    pastel: p,
    estado: ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO'][i],
    fecha: '25/04/2026',
    cantidad: i + 1,
  }));

  const estadoColors: Record<string, string> = {
    'PENDIENTE': '#fef3c7',
    'PAGADO': '#dcfce7',
    'PREPARANDO': '#dbeafe',
    'LISTO': '#f3e8ff',
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Gestión de Pedidos</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Producto</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Total</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>#{pedido.id}</td>
              <td style={{ padding: '1rem' }}>{pedido.pastel.nombre}</td>
              <td style={{ padding: '1rem' }}>{pedido.fecha}</td>
              <td style={{ padding: '1rem' }}>${pedido.pastel.precio * pedido.cantidad}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  background: estadoColors[pedido.estado],
                  color: '#374151'
                }}>
                  {pedido.estado}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <select style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <option value="">Cambiar estado</option>
                  <option value="PREPARANDO">Preparando</option>
                  <option value="LISTO">Listo</option>
                  <option value="EN_CAMINO">En camino</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}