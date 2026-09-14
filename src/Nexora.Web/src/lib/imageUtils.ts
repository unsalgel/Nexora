export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

// Görsel URL'lerini sunucu veya harici kaynak için çözen yardımcı fonksiyon
export const resolveImageUrl = (url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string => {
  if (!url || url.trim() === '' || url.trim() === 'none') return fallback;
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  // Bağıl yüklü dosya yolu (/uploads/...)
  const backendBase = 'http://localhost:5285';
  return `${backendBase}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};
