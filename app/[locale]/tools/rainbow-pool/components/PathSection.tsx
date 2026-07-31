'use client';

import { Badge, Button, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import ItemCard from '@components/Items/ItemCard';
import type { ItemData } from '@types';

type PathSectionProps = {
  label: string;
  colorPalette: 'green' | 'blue' | 'purple' | 'orange';
  items: ItemData[];
  uniqueIdPrefix: string;
  hint?: string;
  initialVisible?: number;
  emptyMessage?: ReactNode;
};

export function PathSection({
  label,
  colorPalette,
  items,
  uniqueIdPrefix,
  hint,
  initialVisible = 6,
  emptyMessage,
}: PathSectionProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const hasMore = items.length > initialVisible;
  const visible = open ? items : items.slice(0, initialVisible);

  if (items.length === 0 && emptyMessage) {
    return (
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
        <Badge colorPalette={colorPalette}>{label}</Badge>
        {emptyMessage}
      </Flex>
    );
  }

  return (
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
      <Badge colorPalette={colorPalette}>{label}</Badge>
      {hint && (
        <Text fontSize="xs" color="whiteAlpha.700">
          {hint}
        </Text>
      )}
      <Flex flexWrap="wrap" gap={2} justify={{ base: 'center', md: 'flex-start' }} w="100%">
        {visible.map((item) => (
          <ItemCard uniqueID={uniqueIdPrefix} small key={item.internal_id} item={item} />
        ))}
      </Flex>
      {hasMore && (
        <Button variant="ghost" size="xs" color="whiteAlpha.800" onClick={() => setOpen((v) => !v)}>
          {open ? t('PetColors.show-less') : t('PetColors.show-all', { 0: items.length })}
        </Button>
      )}
    </Flex>
  );
}
