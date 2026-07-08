import crypto from 'node:crypto';
import { verifyToken as clerkVerifyToken } from '@clerk/backend';
import { clerkClient } from '../lib/clerk';

export interface AuthUser {
  userId: string;
  role?: 'admin' | 'superadmin' | 'user';
}

// ---------------------------------------------------------------------------
// MCP-issued agent tokens (HS256, signed with MCP_JWT_SECRET)
// The MCP server mints these via the OAuth token endpoint; the backend trusts
// them so agents can call the API on behalf of a user without a Clerk session.
// ---------------------------------------------------------------------------
const MCP_ISSUER = 'dolce-atelier-mcp';
const MCP_AUDIENCE = 'dolce-atelier-mcp';

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

export function mcpClaimsFromHeader(
  authHeader: string | null,
): { sub: string; role: string } | null {
  const MCP_JWT_SECRET = process.env.MCP_JWT_SECRET;
  if (!MCP_JWT_SECRET) return null;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;

  const expected = crypto
    .createHmac('sha256', MCP_JWT_SECRET)
    .update(`${h}.${p}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const a = Buffer.from(s);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  try {
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let payload: { sub?: string; role?: string; iss?: string; aud?: string; exp?: number };
  try {
    payload = JSON.parse(b64urlDecode(p).toString('utf8'));
  } catch {
    return null;
  }

  if (payload.iss !== MCP_ISSUER || payload.aud !== MCP_AUDIENCE) return null;
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (!payload.sub) return null;

  return { sub: payload.sub, role: payload.role ?? 'user' };
}

export async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('[AUTH] No Bearer token found in authHeader:', authHeader);
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const session = await clerkVerifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return session.sub;
  } catch {
    // Fall back to an MCP-issued agent token.
    const mcp = mcpClaimsFromHeader(authHeader);
    return mcp?.sub ?? null;
  }
}

export async function verifyAdmin(authHeader: string | null): Promise<AuthUser | null> {
  const mcp = mcpClaimsFromHeader(authHeader);
  const userId = await verifyToken(authHeader);

  if (!userId) {
    return null;
  }

  // An MCP token already carries the role — trust it for admin checks.
  if (mcp && (mcp.role === 'admin' || mcp.role === 'superadmin')) {
    return { userId, role: mcp.role as AuthUser['role'] };
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const publicMetadata = user.publicMetadata as { role?: string };

    return {
      userId,
      role: (publicMetadata.role as AuthUser['role']) || 'user',
    };
  } catch {
    return { userId, role: (mcp?.role as AuthUser['role']) ?? 'user' };
  }
}

export async function authMiddleware(headers: Record<string, string>): Promise<string | null> {
  const authHeader = headers.authorization || headers['Authorization'] || headers['authorization'];
  return verifyToken(authHeader);
}