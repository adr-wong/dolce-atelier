import type { Metadata } from 'next';
import SobreNosotrosClient from './SobreNosotrosClient';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Dolce Atelier',
  description: 'Conoce la historia de Dolce Atelier. Pasteles artesanales elaborados con amor, ingredientes premium y la más alta calidad desde 2020.',
  openGraph: {
    title: 'Sobre Nosotros | Dolce Atelier',
    description: 'Conoce la historia de Dolce Atelier.',
    type: 'website',
  },
};

export default function SobreNosotros() {
  return <SobreNosotrosClient />;
}
