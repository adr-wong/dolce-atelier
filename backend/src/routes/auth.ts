import { Elysia } from 'elysia';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .get('/token', async ({ headers, set }) => {
    const authHeader = headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];
    return { token };
  });