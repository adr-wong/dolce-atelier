import { connect } from 'mongoose';

let cachedConnection: typeof import('mongoose') | null = null;

export async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }

  cachedConnection = await connect(uri);
  
  console.log('✅ MongoDB conectado');
  
  return cachedConnection;
}