import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import { CartMergeProvider } from '@/components/CartMergeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
          <CartMergeProvider>
            <ErrorBoundary>
              <Toaster richColors position="top-right" />
              <Header />
              {children}
            </ErrorBoundary>
          </CartMergeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}