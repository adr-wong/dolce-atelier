'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useMobile } from '@/hooks/useMediaQuery';
import styles from './admin-layout.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/pasteles', label: 'Catálogo', icon: '🎂' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/admin/recetas', label: 'Recetas', icon: '📝' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
];

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/pasteles': 'Catálogo',
  '/admin/pedidos': 'Pedidos',
  '/admin/recetas': 'Recetas',
  '/admin/usuarios': 'Usuarios',
};

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const breadcrumbLabel = BREADCRUMB_MAP[pathname] || pathname.split('/').pop();
  const showBreadcrumb = pathname !== '/admin';

  return (
    <div className={styles.container}>
      {/* ---- Top Bar ---- */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            onClick={toggleSidebar}
            className={styles.hamburger}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <span className={styles.brand}>
            Dolce <span className={styles.brandAccent}>Atelier</span>
          </span>
        </div>
        <div className={styles.topBarRight}>
          <Link href="/" className={styles.topBarLink}>
            🏠 Tienda
          </Link>
          {isSignedIn && <UserButton />}
        </div>
      </header>

      {/* ---- Sidebar backdrop (mobile) ---- */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          className={styles.sidebarBackdrop}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarTitle}>Admin Panel</div>
        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`${styles.sidebarLink} ${isActive(item.href) ? styles.sidebarLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink}>
            ← Volver a la tienda
          </Link>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <main className={styles.main}>
        {showBreadcrumb && (
          <div className={styles.breadcrumbs}>
            <Link href="/admin" className={styles.breadcrumbLink}>Dashboard</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{breadcrumbLabel}</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
