import React, { useState, useEffect } from 'react';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '../../lib/imageUtils';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  wrapperClassName?: string;
}

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

  useEffect(() => {
    setCurrentSrc(resolveImageUrl(src, fallbackSrc));
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
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
