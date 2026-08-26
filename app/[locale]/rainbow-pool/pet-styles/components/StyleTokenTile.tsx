'use client';

import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { CdnImage } from '@components/Utils/CdnImage';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import { wearablePreviewSources } from '@utils/cdnPreview';
import type { StyleToken } from '@utils/petStyles/display';
import { stylesComboHref } from '@utils/petStyles/paths';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AvailableNowBadge, LebronValueBadge } from './StyleTokenSeriesBlock';
import { useFormatLongDate } from './formatLongDate';

const PREVIEW_SIZE = 120;
const ITEM_ICON_SIZE = 80;

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
  const sources = token.imageId ? wearablePreviewSources(token.imageId, token.imageHash) : null;
  const preview = sources ? { ...sources, api: `${sources.api}?noPlaceholder=1` } : null;
  const [useItemIcon, setUseItemIcon] = useState(!preview);
  const [trackedImageId, setTrackedImageId] = useState(token.imageId);

  if (token.imageId !== trackedImageId) {
    setTrackedImageId(token.imageId);
    setUseItemIcon(!token.imageId);
  }

  const hasBadges = token.isPrismatic || token.inStudio || !!token.ncValue;

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
          w={`${PREVIEW_SIZE}px`}
          h={`${PREVIEW_SIZE}px`}
          borderRadius="md"
          bg="blackAlpha.500"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {preview && !useItemIcon ? (
            <CdnImage
              cdnSrc={preview.cdn}
              apiSrc={preview.api}
              alt={token.name}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              unoptimized
              style={{ objectFit: 'contain' }}
              onError={() => setUseItemIcon(true)}
            />
          ) : (
            <Image
              src={token.imageUrl}
              alt={token.name}
              width={ITEM_ICON_SIZE}
              height={ITEM_ICON_SIZE}
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          )}
        </Box>
        <Text fontWeight="semibold" fontSize="sm" textAlign="center" lineClamp={2}>
          {token.name}
        </Text>
        {hasBadges && (
          <HStack gap={1} flexWrap="wrap" justify="center">
            {token.isPrismatic && (
              <Badge
                colorPalette="purple"
                size="xs"
                alignSelf="flex-start"
                w="fit-content"
                fontSize="2xs"
                px={1.5}
                py={0}
                whiteSpace="normal"
              >
                {t('prismatic')}
              </Badge>
            )}
            {token.ncValue && <LebronValueBadge ncValue={token.ncValue} />}
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
