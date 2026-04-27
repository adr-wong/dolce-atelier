import { Elysia } from 'elysia';
import { clerkClient } from '../lib/clerk';

const verifyElysiaAdmin = async (ctx: { headers: Headers; set: { status?: number } }) => {
  try {
    const authHeader = ctx.headers.get('Authorization');
    if (!authHeader) {
      ctx.set.status = 401;
      return { error: 'Unauthorized' };
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      ctx.set.status = 401;
      return { error: 'Unauthorized' };
    }
    const verified = await clerkClient.verifyToken(token);
    const userId = verified?.sub;
    if (!userId) {
      ctx.set.status = 401;
      return { error: 'Unauthorized' };
    }
    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== 'admin' && role !== 'superadmin') {
      ctx.set.status = 403;
      return { error: 'Forbidden' };
    }
    return { user };
  } catch {
    ctx.set.status = 401;
    return { error: 'Unauthorized' };
  }
};

export const elysiaAdminGuard = new Elysia()
  .guard({
    beforeHandle: verifyElysiaAdmin
  });