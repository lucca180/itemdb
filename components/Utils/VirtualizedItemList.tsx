import { useMemo, useRef } from 'react';
import { ItemData } from '../../types';
import { Box, Flex, useSize } from '@chakra-ui/react';
import { ViewportList } from 'react-viewport-list';
import ItemCard from '../Items/ItemCard';

type VirtualizedItemListProps = {
  items: ItemData[];
  sortType?: string;
  highlightList?: number[];
};

export const VirtualizedItemList = (props: VirtualizedItemListProps) => {
  const { items, sortType } = props;
  const elementRef = useRef(null);
  const dimensions = useSize(elementRef, { observeMutation: true });

  const groupedItems = useMemo(
    () =>
      (items ?? []).reduce((acc, cur, i) => {
        const itemSize = dimensions && window.innerWidth >= 768 ? 162 : 112;
        const groupSize = dimensions ? Math.floor(dimensions.width / itemSize) : 8;
        const groupIndex = Math.floor(i / groupSize);
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as ItemData[][]),
    [items, dimensions?.width]
  );

  return (
    <Flex px={[1, 3]} flexFlow="column" gap={3}>
      <Box ref={elementRef} w={'100%'} h={'1px'}></Box>
      <ViewportList items={groupedItems} viewportRef={null} initialPrerender={4} overscan={2}>
        {(group, index) => (
          <Flex gap={[1, 3]} key={index} justifyContent="center" flexWrap={'wrap'}>
            {group.map((item) => (
              <ItemCard
                highlight={props.highlightList?.includes(item.internal_id)}
                sortType={sortType}
                key={item.internal_id}
                item={item}
                disablePrefetch
              />
            ))}
          </Flex>
        )}
      </ViewportList>
    </Flex>
  );
};
