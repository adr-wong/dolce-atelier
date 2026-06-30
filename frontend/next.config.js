/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

export default nextConfig;