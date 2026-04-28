'use client';

import { UserButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const { user } = useUser();
  
  const isAdmin = (user?.publicMetadata as { role?: string })?.role === 'admin';

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1a1a1a',
    textDecoration: 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  };

  const linkStyle: React.CSSProperties = {
    fontWeight: 500,
    fontSize: '0.95rem',
    color: '#666',
    textDecoration: 'none',
    padding: '0.5rem 0',
    transition: 'color 0.2s',
  };

  const adminLinkStyle: React.CSSProperties = {
    ...linkStyle,
    background: '#E11D48',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
  };

  return (
    <header style={headerStyle}>
      <Link href="/" style={logoStyle}>
        Dolce <span style={{ color: '#E11D48' }}>Atelier</span>
      </Link>
      
      <button style={buttonStyle} onClick={toggleMenu} aria-label="Toggle menu">
        ☰
      </button>
      
      <nav style={navStyle}>
        <Link href="/catalogo" style={linkStyle}>
          Catálogo
        </Link>
        <Link href="/contactenos" style={linkStyle}>
          Contáctenos
        </Link>
        <Link href="/sobre-nosotros" style={linkStyle}>
          Nosotros
        </Link>
        <Link href="/carrito" style={linkStyle}>
          Carrito
        </Link>
        <SignedIn>
          {isAdmin && (
            <Link href="/admin" style={adminLinkStyle}>
              Panel Admin
            </Link>
          )}
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in" style={{ ...linkStyle, color: '#E11D48' }}>
            Iniciar Sesión
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}