'use client';

import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function Header() {
  return (
    <header style={{
      padding: '1rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        Dolce Atelier
      </Link>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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