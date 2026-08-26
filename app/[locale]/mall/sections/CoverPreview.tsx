'use client';

import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { CdnImage } from '@components/Utils/CdnImage';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import { wearablePreviewSources } from '@utils/cdnPreview';

type CoverPreviewProps = {
  imageId: string;
  imageHash?: string;
  name: string;
  description: string;
  /**
   * Shrink the preview inside the frame so tall wearables are not edge-cropped.
   * 1 = fill the box; 0.85 = ~15% inset (default 1).
   */
  imageScale?: number;
};

export function CoverPreview({
  imageId,
  imageHash,
  name,
  description,
  imageScale = 1,
}: CoverPreviewProps) {
  const sources = wearablePreviewSources(imageId, imageHash);
  const [useIcon, setUseIcon] = useState(false);
  const fitPct = `${Math.min(Math.max(imageScale, 0.5), 1) * 100}%`;

  return (
    <Box
      flexShrink={0}
      w="100%"
      h={{ base: '160px', md: '200px' }}
      borderRadius="lg"
      bg="blackAlpha.500"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={imageScale < 1 ? { base: 2, md: 3 } : undefined}
    >
      {!useIcon ? (
        <CdnImage
          cdnSrc={sources.cdn}
          apiSrc={`${sources.api}?noPlaceholder=1`}
          alt={name}
          width={200}
          height={200}
          unoptimized
          style={{ objectFit: 'contain', maxWidth: fitPct, maxHeight: fitPct }}
          onError={() => setUseIcon(true)}
        />
      ) : (
        <ItemImageV2
          item={{ image: { id: imageId, url: '' }, description }}
          width={80}
          height={80}
        />
      )}
    </Box>
  );
}
