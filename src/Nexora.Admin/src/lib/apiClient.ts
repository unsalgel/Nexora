import axios from 'axios';
import { ENV } from './env';


export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      // Eğer halihazırda bir yenileme işlemi devam ediyorsa, paralel istekleri kuyrukta beklet
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err: unknown) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('adminRefreshToken');
      const accessToken = localStorage.getItem('adminAccessToken');

      if (refreshToken && accessToken) {
        try {
          const res = await axios.post(`${ENV.API_URL}/auth/refresh-token`, {
            accessToken,
            refreshToken
          });

          if (res.data?.isSuccess && res.data?.data) {
            const newAccessToken = res.data.data.accessToken;
            const newRefreshToken = res.data.data.refreshToken;
            
            localStorage.setItem('adminAccessToken', newAccessToken);
            localStorage.setItem('adminRefreshToken', newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return apiClient(originalRequest);
          } else {
            processQueue(new Error('Token yenilenemedi.'));
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            window.location.href = '/login';
          }
        } catch (refreshError: unknown) {
          processQueue(refreshError);
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('adminRefreshToken');
  const accessToken = localStorage.getItem('adminAccessToken');
  if (refreshToken) {
    try {
      await axios.post(
        `${ENV.API_URL}/auth/revoke-token`,
        { refreshToken },
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        }
      );
    } catch {
      // Ağ veya sunucu hatası durumunda dahi yerel oturum temizliğini engelleme
    }
  }
  localStorage.removeItem('adminAccessToken');
  localStorage.removeItem('adminRefreshToken');
  window.location.href = '/login';
};

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

