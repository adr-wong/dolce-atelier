import { Elysia, t } from 'elysia';
import { clerkClient } from '../lib/clerk';
import { verifyAdmin } from '../middleware/auth';

const isDev = process.env.NODE_ENV === 'development';

export const usuarioRoutes = new Elysia({ prefix: '/api/admin/usuarios' })
  .guard(async ({ headers, set }) => {
    if (isDev && process.env.SKIP_AUTH === 'true') return;
    
    const admin = await verifyAdmin(headers.get('Authorization'));

    if (!admin) {
      set.status = 401;
      return { error: 'No autenticado' };
    }

    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      set.status = 403;
      return { error: 'Acceso denegado. Se requiere rol admin.' };
    }
  }, (app) =>
    app
      .get('/', async () => {
        const users = await clerkClient.users.getUserList({ limit: 100 });
        
        return users.data.map(user => ({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || 'Sin email',
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          role: (user.publicMetadata as { role?: string })?.role || 'user',
        }));
      })
      .put('/:id/rol', async ({ params, body }) => {
        const { role } = body as { role: string };
        
        await clerkClient.users.updateUserMetadata(params.id, {
          publicMetadata: { role },
        });
        
        return { success: true, role };
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ role: t.String() })
      })
  );