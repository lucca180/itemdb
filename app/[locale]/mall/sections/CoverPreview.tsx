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
};

export function CoverPreview({ imageId, imageHash, name, description }: CoverPreviewProps) {
  const sources = wearablePreviewSources(imageId, imageHash);
  const [useIcon, setUseIcon] = useState(false);

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
    >
      {!useIcon ? (
        <CdnImage
          cdnSrc={sources.cdn}
          apiSrc={`${sources.api}?noPlaceholder=1`}
          alt={name}
          width={200}
          height={200}
          unoptimized
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
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
