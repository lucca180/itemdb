import { useMemo, useRef } from 'react';
import { ItemData } from '../../types';
import { Flex, useDimensions } from '@chakra-ui/react';
import { ViewportList } from 'react-viewport-list';
import ItemCard from '../Items/ItemCard';

type VirtualizedItemListProps = {
  items: ItemData[];
  key?: string | number;
};

export const VirtualizedItemList = (props: VirtualizedItemListProps) => {
  const { items, key } = props;
  const elementRef = useRef(null);
  const dimensions = useDimensions(elementRef, true);

  const groupedItems = useMemo(
    () =>
      (items ?? []).reduce((acc, cur, i) => {
        const itemSize = dimensions && dimensions.borderBox.width >= 768 ? 160 : 110;
        const groupSize = dimensions ? Math.floor(dimensions.borderBox.width / itemSize) : 8;

        const groupIndex = Math.floor(i / groupSize);
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as ItemData[][]),
    [items, dimensions?.borderBox.width]
  );

  return (
    <Flex px={[1, 3]} flexFlow="column" gap={3}>
      <ViewportList items={groupedItems} viewportRef={null} initialPrerender={4} overscan={2}>
        {(group, index) => (
          <Flex
            ref={elementRef}
            gap={[1, 3]}
            key={key ? key + index.toString() : index}
            justifyContent="center"
            flexWrap={'wrap'}
          >
            {group.map((item) => (
              <ItemCard key={item.internal_id} item={item} disablePrefetch />
            ))}
          </Flex>
        )}
      </ViewportList>
    </Flex>
  );
};