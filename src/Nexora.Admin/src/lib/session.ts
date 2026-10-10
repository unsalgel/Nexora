import { useSyncExternalStore } from 'react';
const SESSION_EVENT = 'nexora:admin-session-changed';
const ACCESS_KEY = 'adminAccessToken';
const REFRESH_KEY = 'adminRefreshToken';
export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setSessionTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  window.dispatchEvent(new Event(SESSION_EVENT));
};
export const clearSession = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
};
const subscribe = (listener: () => void) => {
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
export const useAccessToken = () => useSyncExternalStore(subscribe, getAccessToken, () => null);
