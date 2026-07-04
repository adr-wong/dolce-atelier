import { Elysia, t } from 'elysia';
import { verifyAdmin } from '../middleware/auth';
import { getDashboardStats } from '../controllers/admin/dashboardController';
import { listPasteles, createPastel, updatePastel, deletePastel } from '../controllers/admin/pastelController';
import { listPedidos, updatePedidoStatus } from '../controllers/admin/pedidoController';
import { listRecetas, createReceta, updateReceta, deleteReceta } from '../controllers/admin/recetaController';

const isDev = process.env.NODE_ENV === 'development';
const skipAuth = isDev && process.env.SKIP_AUTH === 'true';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  .guard(async ({ headers, set, path }) => {
    console.log(`[ADMIN] ${path} - Auth header:`, headers.get('authorization')?.substring(0, 30) + '?');
    
    if (skipAuth) {
      console.log('[ADMIN] Skip auth enabled');
      return;
    }
    
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
      .get('/stats', async () => {
        const { pedidoService, recetaService, pastelService } = await import('../services');
        const [pedidosHoy, recetasPendientes, productos, ingresosMes] = await Promise.all([
          pedidoService.contarPedidosHoy(),
          recetaService.contarPendientes(),
          pastelService.listar(),
          pedidoService.calcularIngresosMes(),
        ]);

        return {
          stats: {
            pedidosHoy,
            recetasPendientes,
            productos: productos.length,
            ingresosMes,
          },
        };
      })
      .get('/dashboard', getDashboardStats)
      .get('/pasteles', listPasteles, {
        query: t.Object({
          search: t.Optional(t.String()),
          page: t.Optional(t.Numeric())
        })
      })
      .post('/pasteles', createPastel, {
        body: t.Object({
          nombre: t.String(),
          descripcion: t.Optional(t.String()),
          precio: t.Number(),
          imagen: t.Optional(t.String()),
          categoria: t.Optional(t.String())
        })
      })
      .put('/pasteles/:id', updatePastel, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          nombre: t.Optional(t.String()),
          descripcion: t.Optional(t.String()),
          precio: t.Optional(t.Number()),
          imagen: t.Optional(t.String()),
          categoria: t.Optional(t.String())
        })
      })
      .delete('/pasteles/:id', deletePastel, {
        params: t.Object({ id: t.String() })
      })
      .get('/pedidos', listPedidos, {
        query: t.Object({
          status: t.Optional(t.String()),
          date: t.Optional(t.String())
        })
      })
      .put('/pedidos/:id/status', updatePedidoStatus, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ status: t.String() })
      })
      .get('/recetas', listRecetas)
      .post('/recetas', createReceta, {
        body: t.Object({
          clerkUserId: t.Optional(t.String()),
          nota: t.String(),
          personas: t.Optional(t.Number()),
          archivoUrl: t.Optional(t.String())
        })
      })
      .put('/recetas/:id', updateReceta, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          nota: t.Optional(t.String()),
          personas: t.Optional(t.Number()),
          archivoUrl: t.Optional(t.String()),
          estado: t.Optional(t.String()),
          cotizacion: t.Optional(t.Number())
        })
      })
      .delete('/recetas/:id', deleteReceta, {
        params: t.Object({ id: t.String() })
      })
      // HU-035: Gestionar categorias
      .get('/categorias', async () => {
        const Categoria = (await import('../models/Categoria')).Categoria;
        return Categoria.find().sort({ orden: 1 });
      })
      .post('/categorias', async ({ body }) => {
        const Categoria = (await import('../models/Categoria')).Categoria;
        const categoria = await Categoria.create(body);
        return { categoria };
      }, {
        body: t.Object({
          nombre: t.String({ minLength: 1 }),
          slug: t.String({ minLength: 1 }),
          descripcion: t.Optional(t.String()),
          imagen: t.Optional(t.String()),
          orden: t.Optional(t.Number()),
        }),
      })
      .put('/categorias/:id', async ({ params, body }) => {
        const Categoria = (await import('../models/Categoria')).Categoria;
        const categoria = await Categoria.findByIdAndUpdate(params.id, body, { new: true });
        if (!categoria) {
          return new Response(JSON.stringify({ error: 'No encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return { categoria };
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          nombre: t.Optional(t.String()),
          slug: t.Optional(t.String()),
          descripcion: t.Optional(t.String()),
          imagen: t.Optional(t.String()),
          activa: t.Optional(t.Boolean()),
          orden: t.Optional(t.Number()),
        }),
      })
      .delete('/categorias/:id', async ({ params }) => {
        const Categoria = (await import('../models/Categoria')).Categoria;
        await Categoria.findByIdAndDelete(params.id);
        return { success: true };
      }, {
        params: t.Object({ id: t.String() }),
      })
  );