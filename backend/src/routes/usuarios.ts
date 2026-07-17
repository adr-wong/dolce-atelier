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
      .get('/', async ({ query }) => {
        const page = Number(query?.page) || 1;
        const limit = Number(query?.limit) || 12;
        const offset = (page - 1) * limit;

        const users = await clerkClient.users.getUserList({ limit, offset });

        return {
          usuarios: users.data.map(user => ({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || 'Sin email',
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
            role: (user.publicMetadata as { role?: string })?.role || 'user',
          })),
          total: users.totalCount,
          page,
          totalPages: Math.ceil(users.totalCount / limit),
        };
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
      // HU-005: Impersonacion - admin obtiene token de sesion como usuario
      .post('/:id/impersonar', async ({ params }) => {
        try {
          // Crear un token de impersonacion via Clerk
          const token = await clerkClient.sessions.createSessionToken({
            userId: params.id,
          });
          return { token };
        } catch (error: any) {
          return new Response(
            JSON.stringify({ error: 'No se pudo impersonar al usuario', details: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }, {
        params: t.Object({ id: t.String() }),
      })
  );