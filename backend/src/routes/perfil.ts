import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { Pedido } from '../models';
import { clerkClient } from '../lib/clerk';

export const perfilRoutes = new Elysia({ prefix: '/api/perfil' })
  // HU-027: Editar datos personales
  .put('/', async ({ headers, body }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { firstName, lastName } = body as { firstName?: string; lastName?: string };
    await clerkClient.users.updateUser(userId, { firstName, lastName });
    return { success: true };
  }, {
    body: t.Object({
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
    }),
  })

  // HU-028: Historial de direcciones
  .get('/direcciones', async ({ headers }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const pedidos = await Pedido.find({
      clerkUserId: userId,
      direccionEnvio: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .select('direccionEnvio createdAt')
      .limit(20);

    const direcciones = pedidos
      .filter(p => p.direccionEnvio)
      .map(p => ({
        direccion: p.direccionEnvio,
        ultimaUsada: p.createdAt,
      }));

    // Deduplicate
    const unicas = direcciones.filter(
      (d, i, arr) => arr.findIndex(x => x.direccion === d.direccion) === i
    );

    return { direcciones: unicas };
  })

  // HU-038: Cambiar contraseña (Clerk)
  .post('/cambiar-password', async ({ headers, body }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { newPassword } = body as {
      currentPassword?: string;
      newPassword: string;
    };

    try {
      // Verify current password via Clerk
      const user = await clerkClient.users.getUser(userId);
      if (!user.passwordEnabled) {
        return new Response(
          JSON.stringify({ error: 'Tu cuenta no tiene contraseña (usa SSO)' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await clerkClient.users.updateUser(userId, { password: newPassword });
      return { success: true };
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || 'Error al cambiar contraseña' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }, {
    body: t.Object({
      currentPassword: t.String({ minLength: 1 }),
      newPassword: t.String({ minLength: 8 }),
    }),
  })

  // HU-039: Cerrar sesión en todos los dispositivos
  .post('/cerrar-sesiones', async ({ headers }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const sessions = await clerkClient.sessions.getSessionList({ userId });
      for (const session of sessions.data) {
        await clerkClient.sessions.revokeSession(session.id);
      }
      return { success: true, sesionesCerradas: sessions.data.length };
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
