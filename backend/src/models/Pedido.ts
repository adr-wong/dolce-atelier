import mongoose, { Schema, Document } from 'mongoose';

export type EstadoPedido =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'PREPARANDO'
  | 'LISTO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface IItemPedido {
  pastelId: mongoose.Types.ObjectId;
  nombre: string;
  precioSnapshot: number;
  cantidad: number;
}

export interface IPedido extends Document {
  clerkUserId: string;
  estado: EstadoPedido;
  total: number;
  items: IItemPedido[];
  metodoEntrega: 'DOMICILIO' | 'TIENDA';
  direccionEnvio?: string;
  telefono?: string;
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemPedidoSchema = new Schema<IItemPedido>({
  pastelId: { type: Schema.Types.ObjectId, ref: 'Pastel', required: true },
  nombre: { type: String, required: true },
  precioSnapshot: { type: Number, required: true },
  cantidad: { type: Number, required: true, min: 1 },
}, { _id: false });

const PedidoSchema = new Schema<IPedido>(
  {
    clerkUserId: { type: String, required: true, index: true },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'],
      default: 'PENDIENTE',
      index: true,
    },
    total: { type: Number, required: true },
    items: { type: [ItemPedidoSchema], required: true },
    metodoEntrega: {
      type: String,
      enum: ['DOMICILIO', 'TIENDA'],
      required: true,
    },
    direccionEnvio: { type: String },
    telefono: { type: String },
    stripeSessionId: { type: String, index: true },
  },
  { timestamps: true }
);

export const Pedido = mongoose.model<IPedido>('Pedido', PedidoSchema);