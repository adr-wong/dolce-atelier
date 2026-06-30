/**
 * Returns the backend API base URL.
 * - On the server (SSR): uses NEXT_PUBLIC_API_URL env var
 * - On the client (browser): returns empty string so fetch uses relative URLs
 *   which get proxied by Next.js rewrites to the backend.
 *
 * This solves the "localhost doesn't work on mobile" problem:
 * the phone accesses the site via 192.168.x.x:3000, and relative
 * API calls go to 192.168.x.x:3000/api/... → Next.js proxy → backend :3001
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use env var for direct backend calls
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // Client-side: relative URLs go through Next.js rewrites
  return '';
}
