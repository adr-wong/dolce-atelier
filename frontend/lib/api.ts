const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  pasteles: {
    listar: () => fetchAPI<{ pasteles: import('./types').Pastel[] }>('/api/pasteles'),
    obtener: (id: string) => fetchAPI<import('./types').Pastel>(`/api/pasteles/${id}`),
  },
  pedidos: {
    crear: (data: unknown) => fetchAPI<{ pedido: unknown }>('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    listar: () => fetchAPI<{ pedidos: unknown[] }>('/api/pedidos'),
  },
  recetas: {
    crear: (data: FormData) => fetchAPI<{ receta: unknown }>('/api/recetas', {
      method: 'POST',
      body: data,
    }),
    listar: () => fetchAPI<{ recetas: unknown[] }>('/api/recetas'),
  },
};