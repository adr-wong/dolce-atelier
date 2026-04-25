'use client';

import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

import { useState } from 'react';
// import './styles/header.css'; // CSS removed for now

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="header">
      <Link href="/" className="logo">
        Dolce Atelier
      </Link>
      <button className="menu-button" onClick={toggleMenu} aria-label="Toggle menu">
        ☰
      </button>
      <nav className={menuOpen ? 'open' : ''}>
        <Link href="/catalogo">Catálogo</Link>
        <Link href="/carrito">Carrito</Link>
        <SignedOut>
          <Link href="/sign-in">Iniciar Sesión</Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}