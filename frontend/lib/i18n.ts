// HU-009: i18n configuration skeleton
// Para implementar completamente usar next-intl. Esta es la base.
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export const translations = {
  es: {
    nav: { catalogo: 'Catálogo', recetas: 'Recetas', pedidos: 'Mis Pedidos', admin: 'Admin' },
    home: { title: 'Dolce Atelier', subtitle: 'Pasteles Artesanales' },
    cart: { empty: 'Tu carrito está vacío', checkout: 'Pagar' },
    search: { placeholder: 'Buscar pasteles...' },
    errors: { generic: 'Algo salió mal', retry: 'Reintentar' },
  },
  en: {
    nav: { catalogo: 'Catalog', recetas: 'Recipes', pedidos: 'My Orders', admin: 'Admin' },
    home: { title: 'Dolce Atelier', subtitle: 'Artisanal Cakes' },
    cart: { empty: 'Your cart is empty', checkout: 'Checkout' },
    search: { placeholder: 'Search cakes...' },
    errors: { generic: 'Something went wrong', retry: 'Retry' },
  },
} as const;
