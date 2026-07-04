'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthButtons() {
  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
      <SignedOut>
        <Link
          href="/sign-in"
          style={{
            padding: '12px 32px',
            background: '#c41e3a',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'background 0.2s',
          }}
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/sign-up"
          style={{
            padding: '12px 32px',
            background: 'transparent',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            border: '2px solid white',
            transition: 'background 0.2s',
          }}
        >
          Registrarse
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          href="/catalogo"
          style={{
            padding: '12px 32px',
            background: '#c41e3a',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Ver Catálogo
        </Link>
      </SignedIn>
    </div>
  );
}
