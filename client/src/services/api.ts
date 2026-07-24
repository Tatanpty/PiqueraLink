const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Error desconocido');
  }

  return data as T;
}

// Auth
export const authApi = {
  register: (body: { name: string; email: string; password: string; role: string }) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', { method: 'POST', body }),

  refresh: (token: string) =>
    request<{ user: any; token: string }>('/auth/refresh', { method: 'POST', token }),
};

// Queue
export const queueApi = {
  join: (piqueraId: string, token: string) =>
    request<any>(`/queue/join/${piqueraId}`, { method: 'POST', token }),

  leave: (piqueraId: string, token: string) =>
    request<any>(`/queue/leave/${piqueraId}`, { method: 'DELETE', token }),

  getPosition: (piqueraId: string, token: string) =>
    request<any>(`/queue/position/${piqueraId}`, { token }),

  getStatus: (piqueraId: string, token: string) =>
    request<any>(`/queue/status/${piqueraId}`, { token }),
};

// Trips
export const tripsApi = {
  request: (body: { piqueraId: string; originLat: number; originLng: number; destination: string }, token: string) =>
    request<any>('/trips/request', { method: 'POST', body, token }),

  accept: (tripId: string, token: string) =>
    request<any>(`/trips/${tripId}/accept`, { method: 'PATCH', token }),

  reject: (tripId: string, token: string) =>
    request<any>(`/trips/${tripId}/reject`, { method: 'PATCH', token }),

  complete: (tripId: string, token: string) =>
    request<any>(`/trips/${tripId}/complete`, { method: 'PATCH', token }),

  getStatus: (tripId: string, token: string) =>
    request<any>(`/trips/${tripId}/status`, { token }),
};

// Piqueras
export const piquerasApi = {
  getAll: (token: string) =>
    request<any[]>('/piqueras', { token }),

  getNearby: (lat: number, lng: number, token: string) =>
    request<any[]>(`/piqueras/nearby?lat=${lat}&lng=${lng}`, { token }),

  getNearest: (lat: number, lng: number, token: string) =>
    request<any>(`/piqueras/nearest?lat=${lat}&lng=${lng}`, { token }),

  getMetrics: (piqueraId: string, token: string) =>
    request<any>(`/piqueras/${piqueraId}/metrics`, { token }),
};

// Global Admin
export const globalAdminApi = {
  getOverview: (token: string) =>
    request<any>('/global-admin/overview', { token }),

  getAllPiqueras: (token: string) =>
    request<any[]>('/global-admin/piqueras', { token }),

  getPiqueraDetail: (piqueraId: string, token: string) =>
    request<any>(`/global-admin/piqueras/${piqueraId}`, { token }),
};

// Metrics
export const metricsApi = {
  getGlobal: (token: string) =>
    request<any>('/admin/metrics/global', { token }),
};

export { ApiError };
