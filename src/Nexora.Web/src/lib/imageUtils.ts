// Görsel URL'lerini sunucu veya harici kaynak için çözen yardımcı fonksiyon
export const resolveImageUrl = (url?: string | null, fallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'): string => {
  if (!url) return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Bağıl yüklü dosya yolu (/uploads/...)
  const backendBase = 'http://localhost:5285';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
