import { useSyncExternalStore } from 'react';
export const CHAT_STORAGE_PREFIX = 'nexora_chat_history:';
const SESSION_EVENT = 'nexora:session-changed';
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
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
  localStorage.removeItem('nexora_chat_history');
  localStorage.removeItem('nexora_ai_chat_history');
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CHAT_STORAGE_PREFIX))
      localStorage.removeItem(key);
  }
  sessionStorage.removeItem('appliedCoupon');
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
