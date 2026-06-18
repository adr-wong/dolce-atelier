import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nosotros - Dolce Atelier',
  description: 'Conoce Dolce Atelier, pastelería artesanal.',
};

export default function SobreNosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
