import React, { useState, useEffect } from 'react';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '../../lib/imageUtils';

export const INLINE_SVG_FALLBACK = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f8fafc%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M80%20140l120-60%20120%2060v120l-120%2060-120-60z%22%2F%3E%3Cpath%20d%3D%22M80%20140l120%2060%20120-60%22%2F%3E%3Cpath%20d%3D%22M200%20200v120%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20font-weight%3D%22bold%22%20fill%3D%22%2394a3b8%22%3ENexora%20%C3%9Cr%C3%BCn%20G%C3%B6rseli%3C%2Ftext%3E%3C%2Fsvg%3E';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  wrapperClassName?: string;
}

/**
 * Otomatik hata yakalama, çift kademeli fallback ve CDN kopmalarına karşı korumalı görsel bileşeni
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  alt = 'Ürün Görseli',
  className = '',
  loading = 'lazy',
  wrapperClassName,
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveImageUrl(src, fallbackSrc));
  const [failCount, setFailCount] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(resolveImageUrl(src, fallbackSrc));
    setFailCount(0);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (failCount === 0) {
      // 1. Kademe: Unsplash yüksek kaliteli yedek görsel
      setFailCount(1);
      setCurrentSrc(fallbackSrc);
    } else if (failCount === 1) {
      // 2. Kademe: Ağ kopuk olsa dahi ASLA kırık ikon göstermeyen vektörel SVG
      setFailCount(2);
      setCurrentSrc(INLINE_SVG_FALLBACK);
    }
  };

  const imgElement = (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer-when-downgrade"
      onError={handleError}
      className={className}
      {...rest}
    />
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{imgElement}</div>;
  }

  return imgElement;
};
