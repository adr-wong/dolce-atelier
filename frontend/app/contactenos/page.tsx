import type { Metadata } from 'next';
import ContactenosClient from './ContactenosClient';

export const metadata: Metadata = {
  title: 'Contáctenos | Dolce Atelier',
  description: 'Contáctanos para pedidos personalizados, consultas o cualquier información. Estamos en Calle 50, Paitilla, Ciudad de Panamá.',
  openGraph: {
    title: 'Contáctenos | Dolce Atelier',
    description: 'Contáctanos para pedidos personalizados o consultas.',
    type: 'website',
  },
};

export default function Contactenos() {
  return <ContactenosClient />;
}
