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
} from './routes';

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }))
  .use(pastelRoutes)
  .use(pedidoRoutes)
  .use(recetaRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .use(uploadRoutes)
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = parseInt(process.env.PORT || '3001');

async function start() {
  try {
    await connectDB();
    console.log('✅ Base de datos conectada');

    const handler = app.handle;

    const server = Bun.serve({
      port: PORT,
      fetch: handler,
    });

    console.log(`🚀 Servidor corriendo en http://localhost:${server.port}`);
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
}

start();