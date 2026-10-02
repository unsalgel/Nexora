const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5285';
const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`,
  BACKEND_URL,
  WEB_URL,
  HUBS: {
    APP: `${BACKEND_URL}/hubs/app`,
  },
} as const;
