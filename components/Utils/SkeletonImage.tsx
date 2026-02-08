/* eslint-disable  */
import { Skeleton, AspectRatio } from '@chakra-ui/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type SkeletonImageProps = {
  loadkey: string;
  url: string;
  width?: number | string;
  height?: number | string;
};

export const SkeletonImage = (props: SkeletonImageProps) => {
  const [isLoaded, setIsLoaded] = useState<string | null>(null);
  const { url, loadkey, width, height } = props;

  useEffect(() => {
    if (isLoaded && isLoaded !== loadkey) setIsLoaded(null);
  }, [loadkey]);

  return (
    <Skeleton w={width ?? 300} h={height ?? 300} isLoaded={!!isLoaded} borderRadius={'md'}>
      <AspectRatio ratio={1}>
        <Image
          src={url}
          alt="Item Preview"
          unoptimized
          fill
          priority
          onLoadStart={() => setIsLoaded(null)}
          onLoad={() => setIsLoaded(loadkey)}
        />
      </AspectRatio>
    </Skeleton>
  );
};
