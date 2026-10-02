import axios from 'axios';

export function getCleanBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('omeglea_backend_url');
    if (custom && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || '';
  // Check if envUrl contains unreplaced placeholders or masked characters
  if (envUrl && !envUrl.includes('<') && !envUrl.includes('>') && !envUrl.includes('••') && !envUrl.includes('xn--')) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: `${getCleanBackendUrl()}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function updateApiBaseUrl(newUrl: string): void {
  const clean = newUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  api.defaults.baseURL = `${clean}/api`;
}

// Attach Authorization Bearer token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('omeglea_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('omeglea_token');
      }
    }
    return Promise.reject(error);
  }
);
