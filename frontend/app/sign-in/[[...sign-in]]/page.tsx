'use client';

import { SignIn } from '@clerk/nextjs';
import ClerkCustomFooter from '@/components/ClerkCustomFooter';

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
      <SignIn appearance={{ elements: { footer: { display: 'none' } } }} />
      <ClerkCustomFooter variant="signIn" />
    </div>
  );
}