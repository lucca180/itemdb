'use client';

import { Box, IconButton, Skeleton } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const DEFAULT_SIZE = 300;

export type WearablePreviewProps = {
  url: string;
  alt: string;
  /** Pixel size for the image intrinsic dimensions and max width. */
  size?: number;
  /**
   * When false, keeps the skeleton and does not fetch (e.g. off-screen lazy).
   * Defaults to true.
   */
  enabled?: boolean;
  canCycle?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
};

/**
 * Wearable/style preview with skeleton while the active URL loads.
 * Already-shown URLs swap instantly (no skeleton).
 */
export function WearablePreview({
  url,
  alt,
  size = DEFAULT_SIZE,
  enabled = true,
  canCycle = false,
  onPrev,
  onNext,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: WearablePreviewProps) {
  const [loadedUrls, setLoadedUrls] = useState(() => new Set<string>());
  const isLoaded = loadedUrls.has(url);
  const showSkeleton = !enabled || !isLoaded;

  const markLoaded = (loadedUrl: string) => {
    setLoadedUrls((prev) => {
      if (prev.has(loadedUrl)) return prev;
      const next = new Set(prev);
      next.add(loadedUrl);
      return next;
    });
  };

  return (
    <Box
      w="100%"
      maxW={`${size}px`}
      aspectRatio={1}
      flexShrink={0}
      borderRadius="md"
      bg="blackAlpha.500"
      overflow="hidden"
      position="relative"
      alignSelf={{ base: 'center', sm: 'flex-start' }}
    >
      {showSkeleton && <Skeleton position="absolute" inset={0} borderRadius="md" zIndex={1} />}
      {enabled && (
        <Image
          key={url}
          src={url}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          loading="eager"
          fetchPriority="low"
          onLoad={() => markLoaded(url)}
          onError={() => markLoaded(url)}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            opacity: isLoaded ? 1 : 0,
          }}
        />
      )}
      {canCycle && (
        <>
          <IconButton
            aria-label={prevLabel}
            size="xs"
            variant="subtle"
            bg="blackAlpha.700"
            position="absolute"
            left={1}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={onPrev}
          >
            <LuChevronLeft />
          </IconButton>
          <IconButton
            aria-label={nextLabel}
            size="xs"
            variant="subtle"
            bg="blackAlpha.700"
            position="absolute"
            right={1}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={onNext}
          >
            <LuChevronRight />
          </IconButton>
        </>
      )}
    </Box>
  );
}

/** Populate HTTP cache only — does not affect WearablePreview skeleton state. */
export function warmWearablePreview(url: string): void {
  const img = new window.Image();
  img.src = url;
}
