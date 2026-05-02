'use client'

export default function ClerkCustomFooter({ variant }: { variant?: 'signIn' | 'signUp' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', fontFamily: 'system-ui, sans-serif' }}>
      <a 
        style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', textDecoration: 'none' }} 
        href="/"
      >
        Dolce <span style={{ color: '#E11D48' }}>Atelier</span>
      </a>
      
      {variant === 'signIn' && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Don&apos;t have an account?{' '}
          <a href="/sign-up" style={{ color: '#E11D48', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </a>
        </p>
      )}
      
      {variant === 'signUp' && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <a href="/sign-in" style={{ color: '#E11D48', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      )}
    </div>
  )
}
