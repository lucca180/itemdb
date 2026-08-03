'use client';

import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import MainLink from '@components/Utils/MainLink';
import type { ComboPetStyleGroup } from '@app/server/petStyles';
import type { ItemV2For } from '@types';
import type { ReactNode } from 'react';
import { wearablePreviewSources } from '@utils/cdnPreview';
import {
  STYLES_BASE_PATH,
  stylesBrowseHref,
  stylesComboHref,
  stylesFilterQuery,
  withStylesQuery,
} from '@utils/petStyles/paths';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { warmWearablePreview, WearablePreview } from './WearablePreview';

const PREVIEW_SIZE = 300;
/** Start fetching a bit before the section enters the viewport. */
const LAZY_ROOT_MARGIN = '200px';

type PetStylesSectionProps = {
  groups: ComboPetStyleGroup[];
  heading: string;
  hint?: ReactNode;
  speciesName: string;
  colorName: string;
};

function petStylePreviewSources(item: ItemV2For<'card'>) {
  return wearablePreviewSources(item.image.id, item.image.hash);
}

function useNearViewport<T extends Element>(rootMargin = LAZY_ROOT_MARGIN) {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;

    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return { ref, near };
}

/** Pet Style tokens for this species × colour, grouped by series, with wearable preview. */
export function PetStylesSection({
  groups,
  heading,
  hint,
  speciesName,
  colorName,
}: PetStylesSectionProps) {
  const t = useTranslations('PetStyles');

  if (!groups.length) return null;

  const comboHref = stylesComboHref(speciesName, colorName);

  return (
    <Flex
      flexFlow="column"
      gap={3}
      p={3}
      bg="blackAlpha.400"
      borderRadius="lg"
      w="100%"
      align={{ base: 'center', md: 'flex-start' }}
      textAlign={{ base: 'center', md: 'start' }}
    >
      <Heading as="h2" size="sm" color="cyan.200">
        {heading}
      </Heading>
      {hint && (
        <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
          {hint}
        </Text>
      )}
      <Link asChild fontSize="sm" color="cyan.200" fontWeight="semibold">
        <MainLink href={comboHref}>
          {t('view-combo-styles', { color: colorName, species: speciesName })}
        </MainLink>
      </Link>
      <Flex flexFlow="column" gap={4} w="100%">
        {groups.map((group) => (
          <PetStyleSeriesRow
            key={group.series}
            series={group.series}
            items={group.items}
            seriesHref={withStylesQuery(
              stylesBrowseHref(speciesName),
              stylesFilterQuery({ series: group.series })
            )}
          />
        ))}
      </Flex>
      <Flex
        gap={3}
        flexWrap="wrap"
        fontSize="sm"
        justify={{ base: 'center', md: 'flex-start' }}
        w="100%"
        pt={1}
      >
        <Link asChild color="teal.200">
          <MainLink href={stylesBrowseHref(speciesName)}>
            {t('all-species-styles', { species: speciesName })}
          </MainLink>
        </Link>
        <Text color="whiteAlpha.400">·</Text>
        <Link asChild color="teal.200">
          <MainLink href={stylesBrowseHref(colorName)}>
            {t('all-color-styles', { color: colorName })}
          </MainLink>
        </Link>
        <Text color="whiteAlpha.400">·</Text>
        <Link asChild color="teal.200">
          <MainLink href={STYLES_BASE_PATH}>{t('hub-link')}</MainLink>
        </Link>
      </Flex>
    </Flex>
  );
}

type PetStyleSeriesRowProps = {
  series: string;
  items: ItemV2For<'card'>[];
  seriesHref: string;
};

function PetStyleSeriesRow({ series, items, seriesHref }: PetStyleSeriesRowProps) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];
  const canCycle = items.length > 1;

  // Warm sibling previews into HTTP cache once this row is near the viewport.
  useEffect(() => {
    if (!near) return;
    for (const item of items) {
      warmWearablePreview(petStylePreviewSources(item).cdn);
    }
  }, [near, items]);

  if (!active) return null;

  const goTo = (index: number) => {
    const len = items.length;
    if (!len) return;
    setActiveIndex(((index % len) + len) % len);
  };

  const activePreview = petStylePreviewSources(active);

  return (
    <Box ref={ref} w="100%">
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="whiteAlpha.900"
        mb={2}
        textAlign={{ base: 'center', md: 'start' }}
      >
        <Link asChild color="cyan.100" _hover={{ color: 'cyan.200', textDecoration: 'underline' }}>
          <MainLink href={seriesHref}>{series}</MainLink>
        </Link>
      </Text>
      <Flex
        gap={3}
        align={{ base: 'center', md: 'flex-start' }}
        justify={{ base: 'center', md: 'flex-start' }}
        direction={{ base: 'column', sm: 'row' }}
        w="100%"
      >
        <Flex flexFlow="column" align="center" gap={1} w="100%" maxW={`${PREVIEW_SIZE}px`}>
          <WearablePreview
            cdnSrc={activePreview.cdn}
            apiSrc={activePreview.api}
            alt={`${active.name} preview`}
            size={PREVIEW_SIZE}
            enabled={near}
            canCycle={canCycle}
            onPrev={() => goTo(activeIndex - 1)}
            onNext={() => goTo(activeIndex + 1)}
            prevLabel="Previous style token"
            nextLabel="Next style token"
          />
          {canCycle && (
            <Text fontSize="xs" color="whiteAlpha.700" textAlign="center" px={1}>
              {activeIndex + 1}/{items.length}
            </Text>
          )}
        </Flex>
        <Flex flexWrap="wrap" gap={2} justify={{ base: 'center', md: 'flex-start' }} flex="1">
          {items.map((item, index) => (
            <ItemCardV2
              key={item.internal_id}
              uniqueID={`pet-style-${series}`}
              small
              item={item}
              selected={index === activeIndex}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
