'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMobile } from '@/hooks/useMediaQuery';
import styles from './admin-layout.module.css';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.container}>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className={styles.sidebarToggle}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          className={styles.overlay}
        />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
        <nav className={styles.sidebarNav}>
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
              onClick={closeSidebar}
              className={styles.sidebarLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
