import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { subirImagen } from './services/cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IMAGENES_DIR = join(__dirname, '..', '..', 'frontend', 'public', 'catalogo');

const IMAGENES = [
  'chocolate-clasico.jpg',
  'triple-chocolate.jpg',
  'chocolate-fresas.jpg',
  'lava-chocolate.jpg',
  'chocolate-nueces.jpg',
  'vainilla-clasico.jpg',
  'vainilla-buttercream.jpg',
  'funfetti.jpg',
  'vainilla-caramelo.jpg',
  'vainilla-almendras.jpg',
  'fresa.jpg',
  'pina.jpg',
  'mango.jpg',
  'frutos-rojos.jpg',
  'manzana.jpg',
];

async function upload() {
  console.log('📤 Subiendo imágenes a Cloudinary...\n');
  
  for (const imagen of IMAGENES) {
    try {
      const ruta = join(IMAGENES_DIR, imagen);
      const buffer = readFileSync(ruta);
      console.log(`   Subiendo ${imagen}...`);
      const url = await subirImagen(buffer, 'dolce-atelier/catalogo');
      console.log(`   ✅ ${url}`);
    } catch (error) {
      console.error(`   ❌ Error con ${imagen}:`, error);
    }
  }

  console.log('\n🎉 Todas las imágenes subidas a Cloudinary.');
  process.exit(0);
}

try {
  await upload();
} catch (err) {
  console.error('❌ Error:', err);
  process.exit(1);
}
