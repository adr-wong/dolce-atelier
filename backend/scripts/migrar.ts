import mongoose from 'mongoose';

const pastelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  imagen: { type: String, required: true },
  disponible: { type: Boolean, default: true },
  descripcion: { type: String },
}, { timestamps: true });

const Pastel = mongoose.model('Pastel', pastelSchema);

const LOCAL_URI = 'mongodb://localhost:27017/dolce_atelier';
const ATLAS_URI = 'mongodb://ProgramadorG:Test1234@ac-g1dyv0p-shard-00-00.1dj2uum.mongodb.net:27017,ac-g1dyv0p-shard-00-01.1dj2uum.mongodb.net:27017,ac-g1dyv0p-shard-00-02.1dj2uum.mongodb.net:27017/dolce_atelier?ssl=true&replicaSet=atlas-foglon-shard-0&authSource=admin&retryWrites=true&w=majority';

async function migrate() {
  console.log('🔄 Conectando a MongoDB local...');
  await mongoose.connect(LOCAL_URI);
  
  const pastelesLocales = await Pastel.find();
  console.log(`📦 Encontrados ${pastelesLocales.length} pasteles en MongoDB local`);
  
  if (pastelesLocales.length === 0) {
    console.log('❌ No hay pasteles en local');
    process.exit(0);
  }
  
  console.log('🔄 Cerrando conexión local y conectando a Atlas...');
  await mongoose.disconnect();
  
  await mongoose.connect(ATLAS_URI, { dbName: 'dolce_atelier' });
  
  await Pastel.deleteMany({});
  console.log('🗑️ Colección en Atlas limpiada');
  
  await Pastel.insertMany(pastelesLocales.map(p => p.toObject()));
  console.log(`✅ Importados ${pastelesLocales.length} pasteles a Atlas`);
  
  await mongoose.disconnect();
  console.log('🎉 Migración completada!');
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});