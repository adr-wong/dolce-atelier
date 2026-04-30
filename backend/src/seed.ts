import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { subirImagen } from './services/cloudinary';

const IMAGENES_DIR = 'C:/Users/ELI_BENDECIDA/Desktop/UTP-2026/parcial_1/frontend/public/images/catalogo';

const PASTELES_DATA = [
  {
    nombre: 'Chocolate Clásico',
    precio: 450,
    categoria: 'chocolate',
    imagen: 'chocolate-clasico.jpg',
    disponible: true,
    descripcion: 'Nuestro Pastel de Chocolate Clásico es un bizcocho oscuro y esponjoso elaborado con cacao en polvo premium, con capas intercaladas de relleno de crema de chocolate brillante y una cobertura lisa con acabado elegante. Cada mordisco es una explosión de sabor intenso a chocolate con la suavidad perfecta del relleno.',
  },
  {
    nombre: 'Triple Chocolate',
    precio: 520,
    categoria: 'chocolate',
    imagen: 'triple-chocolate.jpg',
    disponible: true,
    descripcion: 'Una experiencia chocolate extrema con tres capas intensas: chocolate oscuro, chocolate con leche y chocolate blanco. El ganache decorate cae lentamente por los bordes creando un efecto visuals impressionista. Perfecto para los verdadero amantes del chocolate.',
  },
  {
    nombre: 'Chocolate con Fresas',
    precio: 480,
    categoria: 'chocolate',
    imagen: 'chocolate-fresas.jpg',
    disponible: true,
    descripcion: 'La combinación perfecta de lo intenso y lo fresco. Un bizcocho oscuro que contrasta elegantemente con fresas rojas frescas cortadas en láminas y crema blanca suave. Decorado con fresas enteras en la parte superior.',
  },
  {
    nombre: 'Lava de Chocolate',
    precio: 550,
    categoria: 'chocolate',
    imagen: 'lava-chocolate.jpg',
    disponible: true,
    descripcion: 'El estrella de cualquier celebración. Con una consistencia firma en el exterior, al cortarlo revela un centro de chocolate líquido y brillante que fluye como lava. Una combinación de texturas que sorprende en cada bite.',
  },
  {
    nombre: 'Chocolate y Nueces',
    precio: 460,
    categoria: 'chocolate',
    imagen: 'chocolate-nueces.jpg',
    disponible: true,
    descripcion: 'Para quienes aman la textura crujiente. Un bizcocho húmedo con trozos visibles de nuez caramelizada, cubierto con una capa rústica de chocolate con textura granular. El marriage perfecto entre lo suave y lo crocante.',
  },
  {
    nombre: 'Vainilla Clásico',
    precio: 380,
    categoria: 'vainilla',
    imagen: 'vainilla-clasico.jpg',
    disponible: true,
    descripcion: 'La elegancia en su forma más pura. Un bizcocho claro, suave y esponjoso elaborado con esencia de vainilla natural, cubierto con crema blanca lisa y decoración sencilla con toques delicado. Un clásico que nunca pasa de moda.',
  },
  {
    nombre: 'Vainilla con Buttercream',
    precio: 420,
    categoria: 'vainilla',
    imagen: 'vainilla-buttercream.jpg',
    disponible: true,
    descripcion: 'Capas esponjosas de bizcocho de vainilla coronadas por crema buttercream decorada en delicados espiraless. Cada capa es una nubes de textura sedosa que se deshace en tu boca. El favorito de los amantes de lo clásico.',
  },
  {
    nombre: 'Funfetti',
    precio: 440,
    categoria: 'vainilla',
    imagen: 'funfetti.jpg',
    disponible: true,
    descripcion: 'Alegría pura en cada trozo. Un interior relleno de coloridas chispas de sprinkless que revelan un arcoíris al cortar. El exterior blanco con decoración ludique crea un pastel perfecto para celebraciones alegres y niños.',
  },
  {
    nombre: 'Vainilla con Caramelo',
    precio: 460,
    categoria: 'vainilla',
    imagen: 'vainilla-caramelo.jpg',
    disponible: true,
    descripcion: 'Un bizcocho de vainilla dorada con capas de caramelo líquido que gotea elegantemente por los lados. La combinación dulce y cremosa crea un contraste visual y de sabores irresistible. Decorado con piezas de caramelo crujiente.',
  },
  {
    nombre: 'Vainilla y Almendras',
    precio: 440,
    categoria: 'vainilla',
    imagen: 'vainilla-almendras.jpg',
    disponible: true,
    descripcion: 'Sofisticación en cada detalle. Trozos de almendra tostada distribuidos por todo el bizcocho, coronado con láminas de almendra doradas en la parte superior. Una textura crujiente que complementa la suavidad de la vainilla premium.',
  },
  {
    nombre: 'Fresa',
    precio: 420,
    categoria: 'frutas',
    imagen: 'fresa.jpg',
    disponible: true,
    descripcion: 'Romanticismo en forma de pastel. Un tono rosado suave achieved through puré de fresas naturales, decorado con fresas frescas enteras and англ. La frescura de la fruta combina perfectamente con la crema batida suave.',
  },
  {
    nombre: 'Piña',
    precio: 400,
    categoria: 'frutas',
    imagen: 'pina.jpg',
    disponible: true,
    descripcion: 'Un toque tropical que transporta a días soleados. Rodajas de piña dorada dispuestas en corona, con brillo de caramelo que refleja la luz. El jugo de_piña natural moistens el bizcocho creando una experiencia húmeda y jugosa.',
  },
  {
    nombre: 'Mango',
    precio: 440,
    categoria: 'frutas',
    imagen: 'mango.jpg',
    disponible: true,
    descripcion: 'Vibrante y tropical. Un color amarillo achieved through puré de mango maduro, con capas de crema y pulpa de mango. La sweetness natural de la fruta brilla sin necesidad de sabores artificiales. Un explode de verano en cada mordida.',
  },
  {
    nombre: 'Frutos Rojos',
    precio: 480,
    categoria: 'frutas',
    imagen: 'frutos-rojos.jpg',
    disponible: true,
    descripcion: 'La combinación de berries más deliciosa. Decorado con una corona de moras, frambuesas y arándanos frescos sobre crema blanca. El contraste entre el blanco de la crema y los colores intensos de las frutas crea un postre tan hermoso como delicioso.',
  },
  {
    nombre: 'Manzana',
    precio: 390,
    categoria: 'frutas',
    imagen: 'manzana.jpg',
    disponible: true,
    descripcion: 'Un abrazo de cosecha. Trozos de manzana caramelizada visibles en cada corte, con un delicado toque de canola que perfuma el ambiente. El color dorado del bizcocho y las piezas de fruta crean un aspecto casero y reconfortante.',
  },
];

const PastelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  imagen: { type: String, required: true },
  disponible: { type: Boolean, default: true },
  descripcion: { type: String },
}, { timestamps: true });

const Pastel = mongoose.model('Pastel', PastelSchema);

async function seed() {
  console.log('🔄 Conectando a MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ MongoDB conectado');

  console.log('🗑️ Limpiando pasteles existentes...');
  await Pastel.deleteMany({});

  console.log('📤 Subiendo imágenes a Cloudinary...');
  for (const pastel of PASTELES_DATA) {
    try {
      console.log(`   Subiendo ${pastel.imagen}...`);
      const ruta = join(IMAGENES_DIR, pastel.imagen);
      const buffer = readFileSync(ruta);
      const url = await subirImagen(buffer, 'dolce-atelier/catalogo');
      await Pastel.create({ ...pastel, imagen: url });
      console.log(`   ✅ ${pastel.nombre} guardado`);
    } catch (error) {
      console.error(`   ❌ Error con ${pastel.imagen}:`, error);
    }
  }

  console.log('🎉 Seed completado!');
  const total = await Pastel.countDocuments();
  console.log(`📊 Total de pasteles: ${total}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});