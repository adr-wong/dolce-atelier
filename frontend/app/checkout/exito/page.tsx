import { Suspense } from 'react';
import CheckoutExitoContent from './CheckoutExitoContent';

export default function CheckoutExitoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>}>
      <CheckoutExitoContent />
    </Suspense>
  );
}
