import { clerkClient } from '../lib/clerk';

export interface AuthUser {
  userId: string;
  role?: 'admin' | 'superadmin' | 'user';
}

export async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const session = await clerkClient.verifyToken(token);
    return session.sub;
  } catch {
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