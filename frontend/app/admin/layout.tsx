import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 240,
        background: '#1f2937',
        color: '#fff',
        padding: '2rem 1rem'
      }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Admin Panel</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/pasteles', label: 'Catálogo' },
            { href: '/admin/pedidos', label: 'Pedidos' },
            { href: '/admin/recetas', label: 'Recetas' },
            { href: '/admin/usuarios', label: 'Usuarios' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}