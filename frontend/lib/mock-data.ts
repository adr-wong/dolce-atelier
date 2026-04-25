import type { Pastel } from './types';

export const MOCK_PASTELES: Pastel[] = [
  {
    _id: '1',
    nombre: 'Chocolate Belga',
    precio: 450,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/chocolate.jpg',
    disponible: true,
    descripcion: 'Bizcocho de chocolate belga con relleno de ganache y decoración elegante.',
  },
  {
    _id: '2',
    nombre: 'Vainilla Madagascar',
    precio: 380,
    categoria: 'vainilla',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/vainilla.jpg',
    disponible: true,
    descripcion: 'Bizcocho de vainilla natural de Madagascar con buttercream suave.',
  },
  {
    _id: '3',
    nombre: 'Fresa Cremosa',
    precio: 420,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/fresa.jpg',
    disponible: true,
    descripcion: 'Layers de fresa fresca con crema Chantilly y bizcocho esponjoso.',
  },
  {
    _id: '4',
    nombre: 'Red Velvet',
    precio: 480,
    categoria: 'chocolate',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/redvelvet.jpg',
    disponible: true,
    descripcion: 'Clásico Red Velvet con frosting de queso crema.',
  },
  {
    _id: '5',
    nombre: 'Limón y Coco',
    precio: 400,
    categoria: 'frutas',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/limon.jpg',
    disponible: false,
    descripcion: 'Refrescante combinación de limón y coco tropical.',
  },
  {
    _id: '6',
    nombre: 'Zanahoria Premium',
    precio: 390,
    categoria: 'personalizado',
    imagen: 'https://res.cloudinary.com/demo/image/upload/v1/pasteles/zanahoria.jpg',
    disponible: true,
    descripcion: 'Clásico carrot cake con nueces y frosting de queso crema.',
  },
];

export const MOCK_CATEGORIAS = ['chocolate', 'vainilla', 'frutas', 'personalizado'];