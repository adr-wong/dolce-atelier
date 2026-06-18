import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo - Dolce Atelier',
  description: 'Explora nuestra selección de pasteles artesanales: chocolate, vainilla, frutas y más.',
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
