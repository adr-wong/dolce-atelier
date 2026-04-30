import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dolce Atelier | Pasteles Artesanales',
  description: 'Compra pasteles artesanales personalizados',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}