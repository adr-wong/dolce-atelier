import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Pedidos - Dolce Atelier',
  description: 'Historial de tus pedidos de pasteles.',
};

export default function PedidosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
