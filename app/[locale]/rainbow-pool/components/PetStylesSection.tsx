'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import type { ComboPetStyleGroup } from '@app/server/petStyles';
import type { ItemV2For } from '@types';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { warmWearablePreview, WearablePreview } from './WearablePreview';

const PREVIEW_SIZE = 300;
/** Start fetching a bit before the section enters the viewport. */
const LAZY_ROOT_MARGIN = '200px';

type PetStylesSectionProps = {
  groups: ComboPetStyleGroup[];
  heading: string;
  hint?: ReactNode;
};

function petStylePreviewUrl(item: ItemV2For<'card'>): string {
  const hash = item.image.hash ? `?hash=${item.image.hash}` : '';
  return `/api/cache/preview/${item.image.id}.png${hash}`;
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
export function PetStylesSection({ groups, heading, hint }: PetStylesSectionProps) {
  if (!groups.length) return null;

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
      <Flex flexFlow="column" gap={4} w="100%">
        {groups.map((group) => (
          <PetStyleSeriesRow key={group.series} series={group.series} items={group.items} />
        ))}
      </Flex>
    </Flex>
  );
}

type PetStyleSeriesRowProps = {
  series: string;
  items: ItemV2For<'card'>[];
};

function PetStyleSeriesRow({ series, items }: PetStyleSeriesRowProps) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];
  const canCycle = items.length > 1;

  // Warm sibling previews into HTTP cache once this row is near the viewport.
  useEffect(() => {
    if (!near) return;
    for (const item of items) {
      warmWearablePreview(petStylePreviewUrl(item));
    }
  }, [near, items]);

  if (!active) return null;

  const goTo = (index: number) => {
    const len = items.length;
    if (!len) return;
    setActiveIndex(((index % len) + len) % len);
  };

  return (
    <Box ref={ref} w="100%">
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="whiteAlpha.900"
        mb={2}
        textAlign={{ base: 'center', md: 'start' }}
      >
        {series}
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
            url={petStylePreviewUrl(active)}
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
