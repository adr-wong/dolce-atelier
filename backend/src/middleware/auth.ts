import { verifyToken as clerkVerifyToken } from '@clerk/backend';
import { clerkClient } from '../lib/clerk';

export interface AuthUser {
  userId: string;
  role?: 'admin' | 'superadmin' | 'user';
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
  } catch (error) {
    console.error('[AUTH] Token verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      tokenStart: token ? token.substring(0, 20) + '...' : 'MISSING',
      tokenLength: token?.length
    });
    return null;
  }
}

export async function verifyAdmin(authHeader: string | null): Promise<AuthUser | null> {
  const userId = await verifyToken(authHeader);

  if (!userId) {
    return null;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const publicMetadata = user.publicMetadata as { role?: string };

    return {
      userId,
      role: (publicMetadata.role as AuthUser['role']) || 'user',
    };
  } catch {
    return { userId, role: 'user' };
  }
}

export async function authMiddleware(headers: Record<string, string>): Promise<string | null> {
  const authHeader = headers.authorization || headers['Authorization'] || headers['authorization'];
  return verifyToken(authHeader);
}