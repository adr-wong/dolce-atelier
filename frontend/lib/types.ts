export interface Pastel {
  _id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  descripcion?: string;
}

export interface CarritoItem {
  pastel: Pastel;
  cantidad: number;
}

export type EstadoPedido = 
  | 'PENDIENTE'
  | 'PAGADO'
  | 'PREPARANDO'
  | 'LISTO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type EstadoReceta = 
  | 'PENDIENTE'
  | 'REVISANDO'
  | 'COTIZADA'
  | 'ACEPTADA'
  | 'RECHAZADA';