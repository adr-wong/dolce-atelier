import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout - Dolce Atelier',
  description: 'Completa tu pedido de pasteles artesanales.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
