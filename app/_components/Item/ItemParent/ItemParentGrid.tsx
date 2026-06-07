'use client';

import { Button, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import ItemCard from '@components/Items/ItemCard';
import type { ItemData } from '@types';

type Props = {
  items: ItemData[];
  labels: {
    showMore: string;
    showLess: string;
  };
};

export function ItemParentGrid({ items, labels }: Props) {
  const [showMore, setShowMore] = useState(false);
  const visible = showMore ? items : items.slice(0, 4);

  return (
    <>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {visible.map((parentItem) => (
          <ItemCard
            uniqueID="found-inside"
            key={parentItem.internal_id}
            item={parentItem}
            small
            utm_content="found-inside"
          />
        ))}
      </Flex>
      {items.length > 4 && (
        <Flex justifyContent="center" mt={3}>
          <Button size="sm" onClick={() => setShowMore((current) => !current)}>
            {showMore ? labels.showLess : labels.showMore}
          </Button>
        </Flex>
      )}
    </>
  );
}
