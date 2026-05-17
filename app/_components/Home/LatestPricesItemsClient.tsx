'use client';

import { Flex } from '@styled/jsx';
import type { ItemData } from '@types';
import ItemCard from '@components/Items/ItemCard';

type LatestPricesItemsClientProps = {
  items: ItemData[];
};

export function LatestPricesItemsClient({ items }: LatestPricesItemsClientProps) {
  return (
    <Flex flexWrap="wrap" gap={4} justifyContent="center">
      {items.length > 0 &&
        items.map((item) => (
          <ItemCard
            uniqueID="latest-prices"
            item={item}
            key={item.internal_id}
            utm_content="latest-prices"
          />
        ))}
      {items.length === 0 &&
        [...Array(16)].map((_, index) => <ItemCard uniqueID="latest-prices" key={index} />)}
    </Flex>
  );
}
