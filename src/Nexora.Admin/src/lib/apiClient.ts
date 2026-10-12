import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from './env';
import { clearSession, getAccessToken, getSessionRevision, canRestoreSession, setSessionTokens } from './session';
import { createRefreshCoordinator } from './refreshCoordinator';
import { isSameTokenSession } from './tokenSession';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Nexora-Client': 'admin' },
});
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  const originalToken = (config as RetriedRequest)._originalToken;
  if (originalToken && !isSameTokenSession(originalToken, token)) throw new Error('Oturum değişti. Lütfen işlemi yeniden deneyin.');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
interface SessionTokens { accessToken: string; refreshToken: string }
type RetriedRequest = InternalAxiosRequestConfig & { _retry?: boolean; _originalToken?: string };
let coordinateRefresh = createRefreshCoordinator<string>();
let coordinatedToken: string | null = null;
const refreshAccessToken = async (expiredToken: string): Promise<string> => {
  const performRefresh = async () => {
    const accessToken = getAccessToken();
    const revision = getSessionRevision();
    if (!accessToken) throw new Error('Oturumunuz sona erdi.');
    if (!isSameTokenSession(expiredToken, accessToken)) throw new Error('Oturum değişti. Lütfen işlemi yeniden deneyin.');
    if (accessToken !== expiredToken) return accessToken;
    const res = await axios.post<ApiResponse<SessionTokens>>(`${ENV.API_URL}/auth/refresh-token`,
      { refreshToken: '' }, { timeout: 15000, withCredentials: true, headers: { 'X-Nexora-Client': 'admin' } });
    if (!res.data.isSuccess || !res.data.data?.accessToken) throw new Error('Oturum yenilenemedi.');
    if (getSessionRevision() !== revision) throw new Error('Oturum değişti.');
    if (!isSameTokenSession(expiredToken, getAccessToken()) || !isSameTokenSession(expiredToken, res.data.data.accessToken)) throw new Error('Oturum değişti.');
    setSessionTokens(res.data.data.accessToken);
    return res.data.data.accessToken;
  };
  return navigator.locks ? navigator.locks.request('nexora-admin-refresh', performRefresh) : performRefresh();
};
apiClient.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const request = error.config as RetriedRequest | undefined;
  if (error.response?.status !== 401 || !request || request._retry || request.url?.includes('/auth/')) return Promise.reject(error);
  request._retry = true;
  if (!getAccessToken()) {
    clearSession();
    return Promise.reject(error);
  }
  const failedToken = String(request.headers.Authorization || '').replace(/^Bearer /, '');
  request._originalToken = failedToken;
  try {
    if (!isSameTokenSession(failedToken, getAccessToken())) throw new Error('Oturum değişti. Lütfen işlemi yeniden deneyin.');
    if (!isSameTokenSession(failedToken, coordinatedToken)) {
      coordinatedToken = failedToken;
      coordinateRefresh = createRefreshCoordinator<string>();
    }
    const token = await coordinateRefresh(() => refreshAccessToken(failedToken));
    if (!isSameTokenSession(failedToken, getAccessToken()) || !isSameTokenSession(failedToken, token)) throw new Error('Oturum değişti. Lütfen işlemi yeniden deneyin.');
    request.headers.Authorization = `Bearer ${token}`;
    return apiClient(request);
  } catch (refreshError) {
    if (!getAccessToken() || getAccessToken() === failedToken) {
      clearSession();
      window.location.assign('/login');
    }
    return Promise.reject(refreshError);
  }
});
export const restoreSession = async (): Promise<void> => {
  if (!canRestoreSession()) return;
  const revision = getSessionRevision();
  const restore = async () => {
    try {
      const res = await axios.post<ApiResponse<SessionTokens>>(ENV.API_URL + '/auth/refresh-token', { refreshToken: '' },
        { timeout: 10000, withCredentials: true, headers: { 'X-Nexora-Client': 'admin' } });
      if (revision === getSessionRevision() && res.data.isSuccess && res.data.data?.accessToken)
        setSessionTokens(res.data.data.accessToken);
    } catch { /* Geçerli cookie yoksa anonim oturumla açılır. */ }
  };
  if (navigator.locks) await navigator.locks.request('nexora-admin-refresh', restore);
  else await restore();
};
interface LoginData { accessToken: string; failedLoginAttempts?: number; failedAttemptDetails?: { attemptedAtUtc: string; ipAddress?: string }[] }
export const login = async <T extends LoginData = LoginData>(credentials: { email: string; password: string }) => {
  const revision = getSessionRevision();
  const authenticate = async () => {
    const response = await axios.post<ApiResponse<T>>(ENV.API_URL + '/auth/login', credentials,
      { timeout: 15000, withCredentials: true, headers: { 'X-Nexora-Client': 'admin' } });
    if (revision !== getSessionRevision()) throw new Error('Oturum değişti. Lütfen tekrar giriş yapın.');
    if (response.data.isSuccess && response.data.data?.accessToken) setSessionTokens(response.data.data.accessToken);
    return response;
  };
  return navigator.locks ? navigator.locks.request('nexora-admin-refresh', authenticate) : authenticate();
};
export const logout = async (): Promise<void> => {
  const accessToken = getAccessToken();
  clearSession();
  try {
    const revoke = () => axios.post(`${ENV.API_URL}/auth/revoke-token`, { refreshToken: '' }, {
      timeout: 15000,
      withCredentials: true,
      headers: { 'X-Nexora-Client': 'admin', ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) },
    });
    if (navigator.locks) await navigator.locks.request('nexora-admin-refresh', revoke);
    else await revoke();
  } catch {
    // Yerel oturum temizliği ağ sonucundan bağımsızdır.
  } finally { if (!getAccessToken()) window.location.assign('/login'); }
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

