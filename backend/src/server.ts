import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB, mongoose } from './lib/db';
import { Pastel } from './models';
import { generalLimiter } from './middleware/rateLimit';
import { logger } from './lib/logger';
import { AppError } from './lib/errors';
import { initWhatsApp, getStatus as getWhatsAppStatus } from './services/whatsapp';
import {
  pastelRoutes,
  pedidoRoutes,
  recetaRoutes,
  webhookRoutes,
  adminRoutes,
  uploadRoutes,
  usuarioRoutes,
  reembolsoRoutes,
  descuentoRoutes,
} from './routes';

const PASTELES_DATA = [
  {
    nombre: 'Chocolate Clásico',
    precio: 450,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823377/dolce-atelier/catalogo/jjjfan0knuj46s7s16za.jpg',
    disponible: true,
    descripcion: 'Nuestro Pastel de Chocolate Clásico es un bizcocho oscuro y esponjoso elaborado con cacao en polvo premium.',
  },
  {
    nombre: 'Triple Chocolate',
    precio: 520,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823378/dolce-atelier/catalogo/l0hxrixl7lnclrbvhley.jpg',
    disponible: true,
    descripcion: 'Una experiencia chocolate extrema con tres capas intensas: chocolate oscuro, chocolate con leche y chocolate blanco.',
  },
  {
    nombre: 'Chocolate con Fresas',
    precio: 480,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823379/dolce-atelier/catalogo/xnwmsdpj2ejg0htb8mlc.jpg',
    disponible: true,
    descripcion: 'La combinación perfecta de lo intenso y lo fresco.',
  },
  {
    nombre: 'Lava de Chocolate',
    precio: 550,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823380/dolce-atelier/catalogo/rtrv0agl8jle5zfh73jk.jpg',
    disponible: true,
    descripcion: 'El estrella de cualquier celebración.',
  },
  {
    nombre: 'Chocolate y Nueces',
    precio: 460,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823380/dolce-atelier/catalogo/mdnhi75yvwnmyutm4cfy.jpg',
    disponible: true,
    descripcion: 'Para quienes aman la textura crujiente.',
  },
  {
    nombre: 'Vainilla Clásico',
    precio: 380,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823381/dolce-atelier/catalogo/gzm8t6fhajq0qy8fwizi.jpg',
    disponible: true,
    descripcion: 'La elegancia en su forma más pura.',
  },
  {
    nombre: 'Vainilla con Buttercream',
    precio: 420,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823382/dolce-atelier/catalogo/erngtzu4oulpam3yc9cm.jpg',
    disponible: true,
    descripcion: 'Capas esponjosas de bizcocho de vainilla coronadas por crema buttercream.',
  },
  {
    nombre: 'Funfetti',
    precio: 440,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823383/dolce-atelier/catalogo/rsbrmuu8x4yzwponxpge.jpg',
    disponible: true,
    descripcion: 'Alegría pura en cada trozo.',
  },
  {
    nombre: 'Vainilla con Caramelo',
    precio: 460,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823383/dolce-atelier/catalogo/u6hqlprbrdgo5qztambm.jpg',
    disponible: true,
    descripcion: 'Un bizcocho de vainilla dorada con capas de caramelo líquido.',
  },
  {
    nombre: 'Vainilla y Almendras',
    precio: 440,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823384/dolce-atelier/catalogo/rynojjaemzyftplbnhm3.jpg',
    disponible: true,
    descripcion: 'Sofisticación en cada detalle.',
  },
  {
    nombre: 'Fresa',
    precio: 420,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823385/dolce-atelier/catalogo/dpchhefrgpkz9tb58rij.jpg',
    disponible: true,
    descripcion: 'Romanticismo en forma de pastel.',
  },
  {
    nombre: 'Piña',
    precio: 400,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823386/dolce-atelier/catalogo/mfplns3aymw6pi9rfsrx.jpg',
    disponible: true,
    descripcion: 'Un toque tropical que transporta a días soleados.',
  },
  {
    nombre: 'Mango',
    precio: 440,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823386/dolce-atelier/catalogo/jr16urgkspz1mrdtspkz.jpg',
    disponible: true,
    descripcion: 'Vibrante y tropical.',
  },
  {
    nombre: 'Frutos Rojos',
    precio: 480,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823387/dolce-atelier/catalogo/ie2j4uskrid1vxpkvck2.jpg',
    disponible: true,
    descripcion: 'La combinación de berries más deliciosa.',
  },
  {
    nombre: 'Manzana',
    precio: 390,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/daffoedqf/image/upload/v1781823388/dolce-atelier/catalogo/coen8qdinaj0dpdwuf1u.jpg',
    disponible: true,
    descripcion: 'Un abrazo de cosecha.',
  },
];

async function autoSeed() {
  try {
    const count = await Pastel.countDocuments();
    if (count === 0) {
      logger.info('Database empty, running auto-seed');
      await Pastel.insertMany(PASTELES_DATA);
      logger.info('Seed completed', { count: PASTELES_DATA.length });
    } else {
      logger.info('Database has pasteles, seed skipped', { count });
    }
  } catch (error) {
    logger.error('Auto-seed failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

export const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }))
  .onBeforeHandle(generalLimiter)
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    logger.info('Request received', {
      method: request.method,
      path: url.pathname,
      hasAuth: !!request.headers.get('authorization'),
      origin: request.headers.get('origin'),
    });
  })
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return error.toJSON();
    }

    logger.error('Unhandled error', {
      code,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } };
    }

    if (error.message?.includes('validation')) {
      set.status = 400;
      return { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.message } };
    }

    set.status = 500;
    return { error: { code: 'INTERNAL', message: 'Error interno del servidor' } };
  })
  .get('/health', async () => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memUsage = process.memoryUsage();
    const waStatus = process.env.WHATSAPP_ENABLED === 'true' ? getWhatsAppStatus() : null;
    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      whatsapp: waStatus,
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    };
  })
  .use(pastelRoutes)
  .use(pedidoRoutes)
  .use(recetaRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .use(uploadRoutes)
  .use(usuarioRoutes)
  .use(reembolsoRoutes)
  .use(descuentoRoutes);

const PORT = parseInt(process.env.PORT || '3001');

if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { message: error.message, stack: error.stack });
    process.exit(1);
  });

  async function start() {
    try {
      await connectDB();
      logger.info('Database connected');
      
      await autoSeed();

      app.listen(PORT, () => {
        logger.info('Server started', { port: PORT });

        if (process.env.WHATSAPP_ENABLED === 'true') {
          initWhatsApp();
        }
      });
    } catch (error) {
      logger.error('Server startup failed', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    }
  }

  start();
}