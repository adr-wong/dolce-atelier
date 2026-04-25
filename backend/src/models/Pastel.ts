import mongoose, { Schema, Document } from 'mongoose';

export interface IPastel extends Document {
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PastelSchema = new Schema<IPastel>(
  {
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    categoria: { type: String, required: true },
    imagen: { type: String, required: true },
    disponible: { type: Boolean, default: true },
    descripcion: { type: String },
  },
  { timestamps: true }
);

export const Pastel = mongoose.model<IPastel>('Pastel', PastelSchema);