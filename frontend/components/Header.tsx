'use client';

import { UserButton, useUser, Show } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { useMobile } from '@/hooks/useMediaQuery';
import styles from './header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const isMobile = useMobile();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const userRole = user?.publicMetadata?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Dolce <span className={styles.logoAccent}>Atelier</span>
      </Link>

      {isMobile && (
        <div className={styles.mobileActions}>
          <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle menu">
            ☰
          </button>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      )}

      <nav className={`${styles.nav} ${isMobile && menuOpen ? styles.navOpen : ''}`}>
        <Link href="/catalogo" className={styles.link} onClick={closeMenu}>
          Catálogo
        </Link>
        <Link href="/contactenos" className={styles.link} onClick={closeMenu}>
          Contáctenos
        </Link>
        <Link href="/sobre-nosotros" className={styles.link} onClick={closeMenu}>
          Nosotros
        </Link>
        <Link href="/carrito" className={styles.link} onClick={closeMenu}>
          Carrito
        </Link>
        <Show when="signed-in">
          <Link href="/pedidos" className={styles.link} onClick={closeMenu}>
            Mis Pedidos
          </Link>
          <Link href="/recetas/mis" className={styles.link} onClick={closeMenu}>
            Mis Recetas
          </Link>
        </Show>
        {isAdmin && (
          <Link href="/admin" className={styles.adminLink} onClick={closeMenu}>
            Panel Admin
          </Link>
        )}
        <Show when="signed-out">
          <Link href="/sign-in" className={styles.linkSignIn} onClick={closeMenu}>
            Iniciar Sesión
          </Link>
        </Show>
        {!isMobile && (
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        )}
      </nav>
    </header>
  );
}
