import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contáctenos - Dolce Atelier',
  description: 'Contáctanos para pedidos personalizados.',
};

export default function ContactenosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
