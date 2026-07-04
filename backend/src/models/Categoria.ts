import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoria extends Document {
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen?: string;
  activa: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategoriaSchema = new Schema<ICategoria>(
  {
    nombre: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    descripcion: { type: String },
    imagen: { type: String },
    activa: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Categoria = mongoose.model<ICategoria>('Categoria', CategoriaSchema);
