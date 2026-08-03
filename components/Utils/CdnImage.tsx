'use client';

import Image, { type ImageProps } from '@components/Utils/Image';
import { useState } from 'react';

export type CdnImageProps = Omit<ImageProps, 'src' | 'onError' | 'alt'> & {
  cdnSrc: string;
  apiSrc: string;
  alt: string;
  onError?: ImageProps['onError'];
  onLoad?: ImageProps['onLoad'];
};

/**
 * Prefer CDN; fall back to the API cache route on error (ItemImage pattern).
 */
export function CdnImage({ cdnSrc, apiSrc, alt, onError, onLoad, ...rest }: CdnImageProps) {
  const [useApi, setUseApi] = useState(false);
  const [trackedCdn, setTrackedCdn] = useState(cdnSrc);

  if (cdnSrc !== trackedCdn) {
    setTrackedCdn(cdnSrc);
    setUseApi(false);
  }

  const src = useApi ? apiSrc : cdnSrc;

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={(event) => {
        if (!useApi) {
          setUseApi(true);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
