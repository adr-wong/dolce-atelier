// HU-014: Contract testing skeleton (Pact)
// Para tests completos instalar @pact-foundation/pact. Esto define los contratos esperados.
export const contracts = {
  'GET /api/pasteles': {
    response: {
      pasteles: 'Array<{_id: string, nombre: string, precio: number, categoria: string, imagen: string, disponible: boolean, descripcion?: string}>',
      total: 'number',
      page: 'number',
      totalPages: 'number',
    },
  },
  'POST /api/pedidos': {
    request: {
      email: 'string',
      items: 'Array<{pastelId: string, cantidad: number}>',
      metodoEntrega: "'DOMICILIO' | 'TIENDA'",
      telefono: 'string',
      direccionEnvio: 'string (optional)',
    },
    response: {
      pedido: '{_id: string, estado: string, total: number}',
      checkoutUrl: 'string',
    },
  },
  'POST /api/descuentos/validar': {
    request: { codigo: 'string', subtotal: 'number' },
    response: { valido: 'boolean', montoDescuento: 'number', totalConDescuento: 'number' },
  },
  'PUT /api/pedidos/:id/calificar': {
    request: { calificacion: 'number (1-5)', resena: 'string (optional)' },
    response: { pedido: 'object' },
  },
} as const;
