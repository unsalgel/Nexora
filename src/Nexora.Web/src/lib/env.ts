const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5285';

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || `${BACKEND_URL}/api/v1`,
  BACKEND_URL,
  HUBS: {
    APP: `${BACKEND_URL}/hubs/app`,
  },
} as const;
