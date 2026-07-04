import mongoose, { Schema, Document } from 'mongoose';

export interface ICodigoDescuento extends Document {
  codigo: string;
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  minimoCompra: number;
  fechaExpiracion: Date;
  usosMaximos: number;
  usosActuales: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CodigoDescuentoSchema = new Schema<ICodigoDescuento>(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true },
    tipo: { type: String, enum: ['porcentaje', 'fijo'], required: true },
    valor: { type: Number, required: true, min: 0 },
    minimoCompra: { type: Number, default: 0 },
    fechaExpiracion: { type: Date, required: true },
    usosMaximos: { type: Number, default: 0 },
    usosActuales: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CodigoDescuentoSchema.index({ codigo: 1 });

export const CodigoDescuento = mongoose.model<ICodigoDescuento>(
  'CodigoDescuento',
  CodigoDescuentoSchema
);
