/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.clerk.com https://*.clerk.accounts.dev",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://api.stripe.com https://res.cloudinary.com",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  images: {
    // Desactivamos la optimización de imágenes porque todas vienen de
    // Cloudinary/Unsplash (CDNs que ya optimizan). Esto evita que Next.js
    // genere URLs con localhost (/_next/image?url=...) que fallan al acceder
    // desde otros dispositivos en la red local.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Proxy de API: redirige las llamadas del frontend al backend.
  // En desarrollo usa localhost:3001, en producción usa la variable de entorno.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/pasteles/:path*',
        destination: `${backendUrl}/api/pasteles/:path*`,
      },
      {
        source: '/api/pedidos/:path*',
        destination: `${backendUrl}/api/pedidos/:path*`,
      },
      {
        source: '/api/recetas/:path*',
        destination: `${backendUrl}/api/recetas/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: '/api/upload/:path*',
        destination: `${backendUrl}/api/upload/:path*`,
      },
      {
        source: '/api/usuarios/:path*',
        destination: `${backendUrl}/api/usuarios/:path*`,
      },
      {
        source: '/api/webhook/:path*',
        destination: `${backendUrl}/api/webhook/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      // Nuevas rutas de los HUs
      {
        source: '/api/descuentos/:path*',
        destination: `${backendUrl}/api/descuentos/:path*`,
      },
      {
        source: '/api/reembolsos/:path*',
        destination: `${backendUrl}/api/reembolsos/:path*`,
      },
      {
        source: '/api/carrito/:path*',
        destination: `${backendUrl}/api/carrito/:path*`,
      },
      {
        source: '/api/perfil/:path*',
        destination: `${backendUrl}/api/perfil/:path*`,
      },
      {
        source: '/api/facturas/:path*',
        destination: `${backendUrl}/api/facturas/:path*`,
      },
    ];
  },
};

export default nextConfig;
