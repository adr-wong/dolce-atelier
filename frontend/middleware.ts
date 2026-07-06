import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/carrito(.*)',
  '/pedidos(.*)',
  '/recetas(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const url = new URL(req.url);
  console.log(`[Middleware] ${req.method} ${url.pathname}`);
  
  if (isProtectedRoute(req)) {
    console.log(`[Middleware] Protected route accessed: ${url.pathname}`);
    auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|dток)).*)'],
  runtime: 'nodejs',
};