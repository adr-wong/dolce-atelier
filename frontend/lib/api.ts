const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const method = options?.method || 'GET';
  
  console.log(`[API Request] ${method} ${url}`, {
    headers: options?.headers,
    body: options?.body,
  });

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    console.log(`[API Response] ${method} ${url} - Status: ${res.status}`);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
      console.error(`[API Error] ${method} ${url} - Status: ${res.status}`, errorData);
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(`[API Success] ${method} ${url}`, data);
    return data;
  } catch (error) {
    console.error(`[API Fetch Error] ${method} ${url}`, error);
    throw error;
  }
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