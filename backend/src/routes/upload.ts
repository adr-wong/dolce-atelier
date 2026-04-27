import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';
import { subirReceta, subirImagen } from '../services';

const isDev = process.env.NODE_ENV === 'development';

export const uploadRoutes = new Elysia({ prefix: '/api/upload' })
  .guard(async ({ headers, set }) => {
    if (isDev && process.env.SKIP_AUTH === 'true') return;
    
    const admin = await verifyAdmin(headers.get('Authorization'));

    if (!admin) {
      set.status = 401;
      return { error: 'No autenticado' };
    }
  }, (app) =>
    app.post('/', async ({ request, set }) => {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
          set.status = 400;
          return { error: 'No se proporcionó archivo' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await subirImagen(buffer, 'dolce-atelier/catalogo');

        return { url };
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        set.status = 500;
        return { error: 'Error al subir archivo' };
      }
    })
    .post('/receta', async ({ request, set }) => {
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