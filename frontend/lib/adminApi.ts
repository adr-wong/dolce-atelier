import { getApiUrl } from './get-api-url';

const BASE_URL = getApiUrl();

export interface DashboardStats {
  totalPedidos: number;
  totalRecetas: number;
  totalPasteles: number;
  ingresosMes: number;
  recentPedidos: unknown[];
}

export interface Pastel {
  _id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen: string;
  categoria: string;
  disponible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PastelCreateInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible?: boolean;
}

export interface PastelUpdateInput {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  imagen?: string;
  disponible?: boolean;
}

export interface Pedido {
  _id: string;
  estado: string;
  total: number;
  items: unknown[];
  metodoEntrega: string;
  direccionEnvio?: string;
  createdAt: string;
}

export interface PedidoStatusUpdateInput {
  status: string;
}

export interface Receta {
  _id: string;
  nombre: string;
  descripcion?: string;
  nota?: string;
  email?: string;
  telefono?: string;
  estado: string;
  cotizacion?: number;
  createdAt: string;
}

export interface RecetaCreateInput {
  nombre: string;
  descripcion?: string;
}

export interface RecetaUpdateInput {
  nombre?: string;
  descripcion?: string;
  estado?: string;
  cotizacion?: number;
}

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function getDashboardStats(token: string): Promise<DashboardStats> {
  const response = await fetch(`${BASE_URL}/api/admin/stats`, {
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data = await response.json();
  return {
    totalPedidos: data.stats.pedidosHoy,
    totalRecetas: data.stats.recetasPendientes,
    totalPasteles: data.stats.productos,
    ingresosMes: data.stats.ingresosMes,
    recentPedidos: [],
  };
}

interface PastelesResponse {
  pasteles: Pastel[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

async function getPasteles(token: string, params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Pastel>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : '';
  const endpoint = `/api/admin/pasteles${suffix}`;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data: PastelesResponse = await response.json();
  return {
    data: data.pasteles,
    total: data.total,
    page: data.page,
    totalPages: Math.ceil(data.total / data.limit),
  };
}

async function createPastel(token: string, data: PastelCreateInput): Promise<Pastel> {
  const response = await fetch(`${BASE_URL}/api/admin/pasteles`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

async function updatePastel(token: string, id: string, data: PastelUpdateInput): Promise<Pastel> {
  const response = await fetch(`${BASE_URL}/api/admin/pasteles/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

async function deletePastel(token: string, id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/admin/pasteles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }
}

async function getPedidos(token: string, params?: { status?: string; date?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Pedido>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.date) query.set('date', params.date);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : '';
  const endpoint = `/api/admin/pedidos${suffix}`;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data = await response.json();
  return {
    data: data.pedidos,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
}

async function updatePedidoStatus(token: string, id: string, status: string): Promise<Pedido> {
  const response = await fetch(`${BASE_URL}/api/admin/pedidos/${id}/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

async function getRecetas(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Receta>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : '';
  const endpoint = `/api/admin/recetas${suffix}`;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data = await response.json();
  return {
    data: data.recetas,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
}

async function createReceta(token: string, data: RecetaCreateInput): Promise<Receta> {
  const response = await fetch(`${BASE_URL}/api/admin/recetas`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

async function updateReceta(token: string, id: string, data: RecetaUpdateInput): Promise<Receta> {
  const response = await fetch(`${BASE_URL}/api/admin/recetas/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

async function deleteReceta(token: string, id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/admin/recetas/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }
}

export {
  getDashboardStats,
  getPasteles,
  createPastel,
  updatePastel,
  deletePastel,
  getPedidos,
  updatePedidoStatus,
  getRecetas,
  createReceta,
  updateReceta,
  deleteReceta,
};