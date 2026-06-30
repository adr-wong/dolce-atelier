import type { Metadata } from 'next';
import CatalogoClient from './CatalogoClient';

export const metadata: Metadata = {
  title: 'Catálogo de Pasteles | Dolce Atelier',
  description: 'Explora nuestro catálogo de pasteles artesanales. Chocolate, vainilla, frutas y más. Pasteles personalizados para tus celebraciones.',
  openGraph: {
    title: 'Catálogo de Pasteles | Dolce Atelier',
    description: 'Explora nuestro catálogo de pasteles artesanales.',
    type: 'website',
  },
};

export default function CatalogoPage() {
  return <CatalogoClient />;
}
