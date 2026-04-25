import { createClerkClient } from '@clerk/backend';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getClerkUserId(authHeader: string | null): Promise<string | null> {
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