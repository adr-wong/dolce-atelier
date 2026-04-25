import mongoose, { Schema, Document } from 'mongoose';

export type EstadoReceta =
  | 'PENDIENTE'
  | 'REVISANDO'
  | 'COTIZADA'
  | 'ACEPTADA'
  | 'RECHAZADA';

export interface IReceta extends Document {
  clerkUserId: string;
  archivoUrl: string;
  nota: string;
  personas: number;
  estado: EstadoReceta;
  cotizacion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const RecetaSchema = new Schema<IReceta>(
  {
    clerkUserId: { type: String, required: true, index: true },
    archivoUrl: { type: String },
    nota: { type: String, required: true },
    personas: { type: Number, default: 10 },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'REVISANDO', 'COTIZADA', 'ACEPTADA', 'RECHAZADA'],
      default: 'PENDIENTE',
      index: true,
    },
    cotizacion: { type: Number, default: null },
  },
  { timestamps: true }
);

export const Receta = mongoose.model<IReceta>('Receta', RecetaSchema);