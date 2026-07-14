'use client';

import { Flex } from '@chakra-ui/react';
import type { ItemV2For } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';

type LatestPricesItemsClientProps = {
  items: ItemV2For<'card'>[];
};

export function LatestPricesItemsClient({ items }: LatestPricesItemsClientProps) {
  return (
    <Flex flexWrap="wrap" gap={4} justifyContent="center">
      {items.length > 0 &&
        items.map((item) => (
          <ItemCardV2
            uniqueID="latest-prices"
            item={item}
            key={item.internal_id}
            utm_content="latest-prices"
          />
        ))}
      {items.length === 0 &&
        [...Array(16)].map((_, index) => (
          <ItemCardV2 uniqueID="latest-prices" key={index} isLoading />
        ))}
    </Flex>
  );
}
