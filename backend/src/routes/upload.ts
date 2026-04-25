import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';
import { subirReceta } from '../services';

export const uploadRoutes = new Elysia({ prefix: '/api/upload' })
  .guard(async ({ headers, set }) => {
    const admin = await verifyAdmin(headers.get('Authorization'));

    if (!admin) {
      set.status = 401;
      return { error: 'No autenticado' };
    }
  }, (app) =>
    app.post('/receta', async ({ request, set }) => {
      try {
        const formData = await request.formData();
        const file = formData.get('archivo') as File | null;
        const nombre = formData.get('nombre') as string | null;

        if (!file) {
          set.status = 400;
          return { error: 'No se proporcionó archivo' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await subirReceta(buffer, nombre || `receta-${Date.now()}`);

        return { url };
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        set.status = 500;
        return { error: 'Error al subir archivo' };
      }
    })
  );