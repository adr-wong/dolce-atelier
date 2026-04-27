import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './lib/db';
import {
  pastelRoutes,
  pedidoRoutes,
  recetaRoutes,
  webhookRoutes,
  adminRoutes,
  uploadRoutes,
  usuarioRoutes,
} from './routes';

export const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }))
  .onError(({ code, error, set }) => {
    console.error('Global error:', error);
    set.status = code === 'NOT_FOUND' ? 404 : 500;
    return { error: error.message || 'Internal Server Error' };
  })
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(pastelRoutes)
  .use(pedidoRoutes)
  .use(recetaRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .use(uploadRoutes)
  .use(usuarioRoutes);

const PORT = parseInt(process.env.PORT || '3001');

if (process.env.NODE_ENV !== 'test') {
  async function start() {
    try {
      await connectDB();
      console.log('✅ Base de datos conectada');

      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Error al iniciar:', error);
      process.exit(1);
    }
  }

  start();
}