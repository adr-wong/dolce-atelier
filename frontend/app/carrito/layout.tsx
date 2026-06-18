import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrito - Dolce Atelier',
  description: 'Revisa los pasteles en tu carrito de compras.',
};

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
