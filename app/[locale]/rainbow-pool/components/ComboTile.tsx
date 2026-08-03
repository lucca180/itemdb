'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { CdnImage } from '@components/Utils/CdnImage';
import MainLink from '@components/Utils/MainLink';
import { comboTilePreviewSources } from '@utils/cdnPreview';
import type { RainbowPoolComboTile } from '@utils/petColorTool';
import { isUnknownColorName } from '@utils/petStyles/paths';

type ComboTileProps = {
  combo: RainbowPoolComboTile;
  titleMode?: 'color' | 'species' | 'full';
  releasedLabel?: string;
  /** Smaller preview for dense tile grids (e.g. homepage). */
  compact?: boolean;
  /** Vertical list row (image + title), for homepage side-by-side cards. */
  layout?: 'tile' | 'row';
};

export function ComboTile({
  combo,
  titleMode = 'full',
  releasedLabel,
  compact = false,
  layout = 'tile',
}: ComboTileProps) {
  const title =
    titleMode === 'color'
      ? combo.colorName
      : titleMode === 'species'
        ? combo.speciesName
        : `${combo.colorName} ${combo.speciesName}`;

  const preview = comboTilePreviewSources(
    combo.speciesName,
    combo.colorName,
    combo.previewUrl,
    isUnknownColorName(combo.colorName)
  );

  if (layout === 'row') {
    return (
      <MainLink href={combo.href} style={{ textDecoration: 'none', display: 'block', minWidth: 0 }}>
        <Flex
          minH="80px"
          borderBottom="1px solid rgba(255, 255, 255, 0.16)"
          p={2}
          alignItems="center"
          color="whiteAlpha.900"
          w="100%"
          minW={0}
          overflow="hidden"
          gap={3}
          _hover={{ bg: 'blackAlpha.300' }}
        >
          <Box
            w="60px"
            h="60px"
            borderRadius="12px"
            bg="blackAlpha.500"
            overflow="hidden"
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <CdnImage
              cdnSrc={preview.cdn}
              apiSrc={preview.api}
              alt={title}
              width={60}
              height={60}
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Flex
            flexFlow="column"
            alignItems="start"
            justifyContent="center"
            gap={1}
            minW={0}
            flex={1}
            overflow="hidden"
          >
            <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
              {title}
            </Text>
            {releasedLabel && (
              <Text fontSize="xs" color="whiteAlpha.600">
                {releasedLabel}
              </Text>
            )}
          </Flex>
        </Flex>
      </MainLink>
    );
  }

  const size = compact ? 80 : 120;

  return (
    <MainLink href={combo.href} style={{ textDecoration: 'none' }}>
      <Flex
        flexFlow="column"
        align="center"
        gap={compact ? 1 : 2}
        p={compact ? 2 : 3}
        bg="blackAlpha.400"
        borderRadius="lg"
        h="100%"
        transition="background 0.15s, transform 0.15s"
        _hover={{ bg: 'blackAlpha.600', transform: 'translateY(-2px)' }}
      >
        <Box
          w={`${size}px`}
          h={`${size}px`}
          borderRadius="md"
          bg="blackAlpha.500"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CdnImage
            cdnSrc={preview.cdn}
            apiSrc={preview.api}
            alt={title}
            width={size}
            height={size}
            unoptimized
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Text fontWeight="semibold" fontSize={compact ? 'xs' : 'sm'} textAlign="center">
          {title}
        </Text>
        {releasedLabel && (
          <Text fontSize="xs" color="whiteAlpha.600">
            {releasedLabel}
          </Text>
        )}
      </Flex>
    </MainLink>
  );
}
