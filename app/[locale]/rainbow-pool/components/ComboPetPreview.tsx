'use client';

import { Box, Button, ButtonGroup, Link, Text } from '@chakra-ui/react';
import { CdnImage } from '@components/Utils/CdnImage';
import type { PreviewSources } from '@utils/cdnPreview';
import { useState } from 'react';

type ComboPetPreviewProps = {
  bare: PreviewSources;
  clothed: PreviewSources | null;
  alt: string;
  bareLabel: string;
  clothedLabel: string;
  poweredByLabel: string;
};

export function ComboPetPreview({
  bare,
  clothed,
  alt,
  bareLabel,
  clothedLabel,
  poweredByLabel,
}: ComboPetPreviewProps) {
  const canToggle = Boolean(clothed);
  const [mode, setMode] = useState<'bare' | 'clothed'>('bare');
  const activeMode = canToggle && mode === 'clothed' ? 'clothed' : 'bare';
  const sources = activeMode === 'clothed' && clothed ? clothed : bare;

  return (
    <Box
      position="relative"
      w={{ base: '220px', md: '100%' }}
      h={{ base: '220px', md: '280px' }}
      borderRadius="xl"
      bg="blackAlpha.500"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      alignSelf="center"
    >
      <CdnImage
        key={sources.cdn}
        cdnSrc={sources.cdn}
        apiSrc={sources.api}
        alt={alt}
        width={280}
        height={280}
        unoptimized
        loading={activeMode === 'bare' ? 'eager' : 'lazy'}
        fetchPriority={activeMode === 'bare' ? 'high' : 'auto'}
        style={{ objectFit: 'contain' }}
      />

      {canToggle && (
        <ButtonGroup
          position="absolute"
          top={2}
          right={2}
          zIndex={1}
          size="xs"
          attached
          variant="subtle"
          bg="blackAlpha.700"
          borderRadius="md"
          overflow="hidden"
        >
          <Button
            colorPalette={activeMode === 'bare' ? 'teal' : undefined}
            color={activeMode === 'bare' ? undefined : 'whiteAlpha.800'}
            onClick={() => setMode('bare')}
            data-umami-event="rainbow-pool-preview-toggle"
            data-umami-event-label="bare"
          >
            {bareLabel}
          </Button>
          <Button
            colorPalette={activeMode === 'clothed' ? 'yellow' : undefined}
            color={activeMode === 'clothed' ? undefined : 'whiteAlpha.800'}
            onClick={() => setMode('clothed')}
            data-umami-event="rainbow-pool-preview-toggle"
            data-umami-event-label="clothed"
          >
            {clothedLabel}
          </Button>
        </ButtonGroup>
      )}

      <Text
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        px={2}
        py={1.5}
        fontSize="xs"
        color="whiteAlpha.700"
        textAlign="center"
        bgGradient="linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)"
        pointerEvents="none"
        css={{ textWrap: 'balance' }}
      >
        {poweredByLabel}{' '}
        <Link
          href="https://impress.openneo.net/"
          target="_blank"
          rel="noreferrer"
          fontWeight="bold"
          pointerEvents="auto"
          color="whiteAlpha.900"
        >
          Dress to Impress
        </Link>
      </Text>
    </Box>
  );
}
