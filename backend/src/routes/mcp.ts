import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';

// HU-017: MCP API Keys management (skeleton - keys stored in Clerk metadata)
export const mcpRoutes = new Elysia({ prefix: '/api/admin/mcp' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));
    if (!admin || admin.role !== 'superadmin') {
      set.status = 403;
      return { error: 'Solo superadmin puede gestionar MCP' };
    }
  }, (app) =>
    app
      .get('/keys', async () => {
        // In production, store API keys in DB. Here we track usage metadata.
        return {
          keys: [],
          message: 'MCP API keys gestion via Clerk metadata. Configurar en produccion.',
        };
      })
      .post('/keys', async ({ body }) => {
        const { plan, limite } = body as { plan: string; limite: number };
        // En producción: generar API key, guardar en DB con plan y cuota
        return { apiKey: 'mcp_live_xxxxxxxxxxxx', plan, limite, message: 'Key generada (mock)' };
      }, {
        body: t.Object({ plan: t.String(), limite: t.Number() }),
      })
      .get('/usage', async () => {
        return { usage: [], message: 'Uso de MCP追踪 en metadata de Clerk' };
      })
  );
