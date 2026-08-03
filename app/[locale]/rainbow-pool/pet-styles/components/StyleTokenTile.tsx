'use client';

import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { CdnImage } from '@components/Utils/CdnImage';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import { wearablePreviewSources } from '@utils/cdnPreview';
import type { StyleToken } from '@utils/petStyles/display';
import { stylesComboHref } from '@utils/petStyles/paths';
import { useTranslations } from 'next-intl';
import { AvailableNowBadge } from './StyleTokenSeriesBlock';
import { useFormatLongDate } from './formatLongDate';

type StyleTokenTileProps = {
  token: StyleToken;
  /** Link to species×color styles page (default) or item page. */
  linkTo?: 'combo' | 'item';
};

export function StyleTokenTile({ token, linkTo = 'combo' }: StyleTokenTileProps) {
  const t = useTranslations('PetStyles');
  const formatLongDate = useFormatLongDate();
  const href =
    linkTo === 'item'
      ? `/item/${token.itemSlug}`
      : stylesComboHref(token.speciesName, token.colorName);
  const preview = token.imageId ? wearablePreviewSources(token.imageId) : null;

  return (
    <MainLink href={href} style={{ textDecoration: 'none' }}>
      <Flex
        flexFlow="column"
        align="center"
        gap={2}
        p={3}
        bg="blackAlpha.400"
        borderRadius="lg"
        h="100%"
        transition="background 0.15s, transform 0.15s"
        _hover={{ bg: 'blackAlpha.600', transform: 'translateY(-2px)' }}
      >
        <Box
          w="120px"
          h="120px"
          borderRadius="md"
          bg="blackAlpha.500"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {preview ? (
            <CdnImage
              cdnSrc={preview.cdn}
              apiSrc={preview.api}
              alt={token.name}
              width={120}
              height={120}
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <Image
              src={token.imageUrl}
              alt={token.name}
              width={120}
              height={120}
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          )}
        </Box>
        <Text fontWeight="semibold" fontSize="sm" textAlign="center" lineClamp={2}>
          {token.name}
        </Text>
        {(token.isPrismatic || token.inStudio) && (
          <HStack gap={1} flexWrap="wrap" justify="center">
            {token.isPrismatic && (
              <Badge colorPalette="purple" size="sm">
                {t('prismatic')}
              </Badge>
            )}
            {token.inStudio && <AvailableNowBadge />}
          </HStack>
        )}
        <Text fontSize="xs" color="whiteAlpha.600">
          {formatLongDate(token.releasedAt)}
        </Text>
      </Flex>
    </MainLink>
  );
}
