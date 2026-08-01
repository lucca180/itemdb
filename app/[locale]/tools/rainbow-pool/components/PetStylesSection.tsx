'use client';

import { Badge, Box, Flex, IconButton, Skeleton, Text } from '@chakra-ui/react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import Image from '@components/Utils/Image';
import type { ComboPetStyleGroup } from '@app/server/petStyles';
import type { ItemV2For } from '@types';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const PREVIEW_SIZE = 300;
/** Start fetching a bit before the section enters the viewport. */
const LAZY_ROOT_MARGIN = '200px';

type PetStylesSectionProps = {
  groups: ComboPetStyleGroup[];
  label: string;
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
export function PetStylesSection({ groups, label, hint }: PetStylesSectionProps) {
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
      <Badge colorPalette="cyan">{label}</Badge>
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

  // Warm sibling previews only once this row is near the viewport.
  useEffect(() => {
    if (!near) return;
    for (const item of items) {
      const img = new window.Image();
      img.src = petStylePreviewUrl(item);
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
          <StyleWearablePreview
            url={petStylePreviewUrl(active)}
            alt={`${active.name} preview`}
            enabled={near}
            canCycle={canCycle}
            onPrev={() => goTo(activeIndex - 1)}
            onNext={() => goTo(activeIndex + 1)}
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

/**
 * Keeps the previous frame visible until the next URL is decoded —
 * no skeleton flash when swapping already-fetched previews.
 * Fetches only after `enabled` (near viewport).
 */
function StyleWearablePreview({
  url,
  alt,
  enabled,
  canCycle,
  onPrev,
  onNext,
}: {
  url: string;
  alt: string;
  enabled: boolean;
  canCycle: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const loadedUrls = useRef(new Set<string>());
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (loadedUrls.current.has(url)) {
      const id = requestAnimationFrame(() => setDisplayUrl(url));
      return () => cancelAnimationFrame(id);
    }

    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      loadedUrls.current.add(url);
      setDisplayUrl(url);
    };
    img.onerror = () => {
      if (cancelled) return;
      loadedUrls.current.add(url);
      setDisplayUrl(url);
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [enabled, url]);

  const showSkeleton = displayUrl == null;

  return (
    <Box
      w="100%"
      maxW={`${PREVIEW_SIZE}px`}
      aspectRatio={1}
      flexShrink={0}
      borderRadius="md"
      bg="blackAlpha.500"
      overflow="hidden"
      position="relative"
      alignSelf={{ base: 'center', sm: 'flex-start' }}
    >
      {showSkeleton && <Skeleton position="absolute" inset={0} borderRadius="md" />}
      {displayUrl && (
        <Image
          src={displayUrl}
          alt={alt}
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          unoptimized
          loading="lazy"
          fetchPriority="low"
          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        />
      )}
      {canCycle && (
        <>
          <IconButton
            aria-label="Previous style token"
            size="xs"
            variant="subtle"
            bg="blackAlpha.700"
            position="absolute"
            left={1}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            onClick={onPrev}
          >
            <LuChevronLeft />
          </IconButton>
          <IconButton
            aria-label="Next style token"
            size="xs"
            variant="subtle"
            bg="blackAlpha.700"
            position="absolute"
            right={1}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            onClick={onNext}
          >
            <LuChevronRight />
          </IconButton>
        </>
      )}
    </Box>
  );
}
