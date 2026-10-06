import { ENV } from './env';

export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

export const resolveImageUrl = (url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string => {
  if (!url || url.trim() === '' || url.trim() === 'none') return fallback;
  const cleanUrl = url.trim();

  if (/[\u0000-\u001F\u007F]/.test(cleanUrl)) return fallback;

  try {
    const absolute = new URL(cleanUrl);
    if ((absolute.protocol === 'http:' || absolute.protocol === 'https:') && !absolute.username && !absolute.password) {
      return absolute.toString();
    }
    return fallback;
  } catch {}

  try {
    const sanitizedPath = cleanUrl.replace(/^[/\\]+/, '');
    const backendBase = ENV.BACKEND_URL.endsWith('/') ? ENV.BACKEND_URL : `${ENV.BACKEND_URL}/`;
    const resolved = new URL(sanitizedPath, backendBase);

    if ((resolved.protocol === 'http:' || resolved.protocol === 'https:') && !resolved.username && !resolved.password) {
      return resolved.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
};
