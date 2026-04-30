'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
      <div className={inter.className} style={{ display: 'flex', minHeight: '100vh', flexDirection: isMobile ? 'column' : 'row' }}>
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 100,
            padding: '0.75rem 1rem',
            background: '#1f2937',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}
      <aside style={{
        width: isMobile ? (sidebarOpen ? 240 : 0) : 240,
        background: '#1f2937',
        color: '#fff',
        padding: isMobile ? (sidebarOpen ? '4rem 1rem 1rem' : '4rem 1rem 1rem') : '2rem 1rem',
        position: isMobile ? 'fixed' : 'relative',
        height: isMobile ? '100vh' : 'auto',
        zIndex: isMobile ? 99 : 'auto',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
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
              onClick={() => isMobile && setSidebarOpen(false)}
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
      <main style={{ flex: 1, padding: isMobile ? '1rem 0.5rem' : '2rem', paddingTop: isMobile ? '4rem' : '2rem' }}>
        {children}
      </main>
    </div>
  );
}