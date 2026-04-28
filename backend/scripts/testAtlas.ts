import mongoose from 'mongoose';

const ATLAS_URI = 'mongodb://ProgramadorG:Test1234@ac-g1dyv0p-shard-00-00.1dj2uum.mongodb.net:27017,ac-g1dyv0p-shard-00-01.1dj2uum.mongodb.net:27017,ac-g1dyv0p-shard-00-02.1dj2uum.mongodb.net:27017/dolce_atelier?ssl=true&replicaSet=atlas-foglon-shard-0&authSource=admin&retryWrites=true&w=majority';

async function test() {
  console.log('🔄 Probando conexión a MongoDB Atlas...');

  try {
    await mongoose.connect(ATLAS_URI, {
      dbName: 'dolce_atelier',
      serverSelectionTimeoutMS: 5000, // falla rápido si no conecta
    });

    if (mongoose.connection.readyState !== 1) {
      throw new Error('No se pudo establecer la conexión');
    }

    console.log('✅ Conectado a Atlas');

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('DB no disponible');
    }

    const count = await db.collection('pastels').countDocuments();
    console.log(`📦 Pasteles en Atlas: ${count}`);

  } catch (err: any) {
    console.error('❌ Error de conexión:');
    console.error('Mensaje:', err.message);

    // Diagnóstico útil
    if (err.message.includes('auth')) {
      console.error('👉 Problema de autenticación (usuario/password)');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('👉 Problema de red/DNS');
    } else if (err.message.includes('IP')) {
      console.error('👉 IP no permitida en MongoDB Atlas');
    }

  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
  }
}

test();