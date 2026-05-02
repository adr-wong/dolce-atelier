'use client';

import { SignUp } from '@clerk/nextjs';
import ClerkCustomFooter from '@/components/ClerkCustomFooter';

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
      <SignUp appearance={{ elements: { footer: { display: 'none' } } }} />
      <ClerkCustomFooter />
    </div>
  );
}