/* eslint-disable  */
import { Skeleton, AspectRatio, Box } from '@chakra-ui/react';
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
    <Box w={width ?? 300} h={height ?? 300} position="relative" borderRadius={'md'}>
      {!isLoaded && (
        <Skeleton borderRadius={'md'} w="100%" h="100%" position="absolute" inset={0} />
      )}
      <AspectRatio ratio={1}>
        <Image
          src={url}
          alt="Item Preview"
          unoptimized
          fill
          priority
          onLoadStart={() => setIsLoaded(null)}
          onLoad={() => setIsLoaded(loadkey)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      </AspectRatio>
    </Box>
  );
};
