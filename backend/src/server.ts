import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './lib/db';
import { Pastel } from './models';
import {
  pastelRoutes,
  pedidoRoutes,
  recetaRoutes,
  webhookRoutes,
  adminRoutes,
  uploadRoutes,
  usuarioRoutes,
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
      console.log('🌱 Base de datos vacía, ejecutando seed automático...');
      await Pastel.insertMany(PASTELES_DATA);
      console.log(`✅ Seed completado: ${PASTELES_DATA.length} pasteles insertados`);
    } else {
      console.log(`ℹ️ Base de datos tiene ${count} pasteles, seed omitido`);
    }
  } catch (error) {
    console.error('❌ Error en auto-seed:', error);
  }
}

export const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }))
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    console.log(`[BACKEND REQUEST] ${request.method} ${url.pathname}${url.search}`, {
      timestamp: new Date().toISOString(),
      hasAuthHeader: !!request.headers.get('authorization'),
      contentType: request.headers.get('content-type'),
      origin: request.headers.get('origin'),
    });
  })
  .onError(({ code, error, set }) => {
    console.error('[BACKEND ERROR]', { code, error: error.message });
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
      
      await autoSeed();

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