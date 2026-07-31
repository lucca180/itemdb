'use client';

import { Button, Collapsible, Flex, Text } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import { SkeletonImage } from '@components/Utils/SkeletonImage';
import { ChevronDownIcon } from '@utils/theme/chakraIcons';
import type { ItemData } from '@types';

type OutfitCardProps = {
  line: string;
  outfit: ItemData[];
  showItemsLabel: string;
  hideItemsLabel: string;
  speciesId?: number | null;
};

export function OutfitCard({
  line,
  outfit,
  showItemsLabel,
  hideItemsLabel,
  speciesId,
}: OutfitCardProps) {
  return (
    <Collapsible.Root
      lazyMount
      unmountOnExit
      bg="blackAlpha.600"
      borderRadius="lg"
      p={3}
      w="100%"
      h="fit-content"
    >
      <Flex flexFlow="column" alignItems="center" gap={2}>
        <Text as="h2" textTransform="capitalize" fontWeight="bold" fontSize="md" textAlign="center">
          {line}
        </Text>
        <SkeletonImage
          url={getPreviewUrl(outfit, speciesId)}
          loadkey={line}
          width={220}
          height={220}
        />
        <Collapsible.Trigger asChild>
          <Button variant="ghost" size="sm" gap={1} color="whiteAlpha.800">
            <Collapsible.Context>
              {(api) => (api.open ? hideItemsLabel : showItemsLabel)}
            </Collapsible.Context>
            <Collapsible.Indicator
              transition="transform 0.2s"
              _open={{ transform: 'rotate(180deg)' }}
            >
              <ChevronDownIcon />
            </Collapsible.Indicator>
          </Button>
        </Collapsible.Trigger>
      </Flex>
      <Collapsible.Content>
        <Flex flexWrap="wrap" justifyContent="center" gap={2} pt={3} pb={1}>
          {outfit.map((item) => (
            <ItemCard uniqueID={`outfit-${line}`} key={item.internal_id} item={item} small />
          ))}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function getPreviewUrl(items: ItemData[], speciesId?: number | null) {
  let url = '/api/cache/preview/outfit?';
  if (speciesId) url += `petId=${speciesId}&`;
  items.forEach((item) => {
    url += `iid[]=${item.internal_id}&`;
  });
  return url;
}
