'use client';

import { Badge, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import type { ItemV2For } from '@types';

type PathSectionProps = {
  label: string;
  colorPalette: 'green' | 'blue' | 'purple' | 'orange';
  items: ItemV2For<'card'>[];
  uniqueIdPrefix: string;
  hint?: string;
  initialVisible?: number;
  emptyMessage?: ReactNode;
  /** Render label as Heading outside the panel (browse-style). */
  labelAsHeading?: boolean;
};

export function PathSection({
  label,
  colorPalette,
  items,
  uniqueIdPrefix,
  hint,
  initialVisible = 6,
  emptyMessage,
  labelAsHeading = false,
}: PathSectionProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const hasMore = items.length > initialVisible;
  const visible = open ? items : items.slice(0, initialVisible);

  const title = labelAsHeading ? (
    <Heading as="h2" size="md">
      {label}
    </Heading>
  ) : (
    <Badge colorPalette={colorPalette}>{label}</Badge>
  );

  const hintEl = hint ? (
    <Text fontSize="xs" color="whiteAlpha.700">
      {hint}
    </Text>
  ) : null;

  const content =
    items.length === 0 && emptyMessage ? (
      emptyMessage
    ) : (
      <>
        <Flex flexWrap="wrap" gap={2} justify={{ base: 'center', md: 'flex-start' }} w="100%">
          {visible.map((item) => (
            <ItemCardV2 uniqueID={uniqueIdPrefix} small key={item.internal_id} item={item} />
          ))}
        </Flex>
        {hasMore && (
          <Button
            variant="ghost"
            size="xs"
            color="whiteAlpha.800"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t('PetColors.show-less') : t('PetColors.show-all', { 0: items.length })}
          </Button>
        )}
      </>
    );

  const panel = (
    <Flex
      flexFlow="column"
      gap={2}
      p={3}
      bg="blackAlpha.400"
      borderRadius="lg"
      w="100%"
      align={{ base: 'center', md: 'flex-start' }}
      textAlign={{ base: 'center', md: 'start' }}
    >
      {!labelAsHeading && title}
      {!labelAsHeading && hintEl}
      {content}
    </Flex>
  );

  if (labelAsHeading) {
    return (
      <Flex flexFlow="column" gap={2} w="100%" align="stretch">
        {title}
        {hintEl}
        {panel}
      </Flex>
    );
  }

  return panel;
}
