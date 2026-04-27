import { Collection, Db, ObjectId } from 'mongodb';
import { connectDB } from '../lib/db';

export function getPastelCollectionMongo(db: Db): Collection<Record<string, unknown>> {
  return db.collection<Record<string, unknown>>('pasteles');
}

export function getPedidoCollectionMongo(db: Db): Collection<Record<string, unknown>> {
  return db.collection<Record<string, unknown>>('pedidos');
}

export function getRecetaCollectionMongo(db: Db): Collection<Record<string, unknown>> {
  return db.collection<Record<string, unknown>>('recetas');
}