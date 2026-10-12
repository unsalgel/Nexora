import { useSyncExternalStore } from 'react';
import { getTokenSessionId } from './tokenSession';
const SESSION_EVENT = 'nexora:admin-session-changed';
const ACCESS_KEY = 'adminAccessToken';
const REFRESH_KEY = 'adminRefreshToken';
localStorage.removeItem(ACCESS_KEY);
localStorage.removeItem(REFRESH_KEY);
let currentAccessToken: string | null = null;
let revision = 0;
const SIGNED_OUT = 'nexora-admin-signed-out';
const SESSION_ID = SIGNED_OUT + ':session-id';
export const canRestoreSession = () => localStorage.getItem(SIGNED_OUT) !== 'true';
window.addEventListener('storage', event => {
  if (event.key === SIGNED_OUT || event.key === SESSION_ID) {
    currentAccessToken = null;
    revision++;
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
});
export const getSessionRevision = () => String(revision) + ':' + localStorage.getItem(SESSION_ID) + ':' + localStorage.getItem(SIGNED_OUT);
export const getAccessToken = () => currentAccessToken;
export const setSessionTokens = (accessToken: string) => {
  const id = getTokenSessionId(accessToken);
  if (id) localStorage.setItem(SESSION_ID, id);
  localStorage.removeItem(SIGNED_OUT);
  currentAccessToken = accessToken;
  revision++;
  window.dispatchEvent(new Event(SESSION_EVENT));
};
export const clearSession = () => {
  localStorage.setItem(SIGNED_OUT, 'true');
  currentAccessToken = null;
  revision++;
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
