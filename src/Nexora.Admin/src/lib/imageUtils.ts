import { ENV } from './env';

export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

export const resolveImageUrl = (url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string => {
  if (!url || url.trim() === '' || url.trim() === 'none') return fallback;
  const cleanUrl = url.trim();

  // Güvenlik (CodeQL XSS Sanitization): Yalnızca http, https veya göreceli güvenli yolları kabul et
  if (/^javascript:/i.test(cleanUrl) || /^data:/i.test(cleanUrl) || /^vbscript:/i.test(cleanUrl)) {
    return fallback;
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  const sanitizedPath = cleanUrl.replace(/^[/\\]+/, '');
  return `${ENV.BACKEND_URL}/${sanitizedPath}`;
};
