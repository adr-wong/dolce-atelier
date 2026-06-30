import mongoose, { connect } from 'mongoose';

export { mongoose };

let cachedConnection: typeof import('mongoose') | null = null;

export async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }

  cachedConnection = await connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  
  console.log('✅ MongoDB conectado');
  
  return cachedConnection;
}