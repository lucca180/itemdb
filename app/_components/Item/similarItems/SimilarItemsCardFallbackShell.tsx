import { Flex } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
  title: string;
};

export function SimilarItemsCardFallbackShell({ item, title }: Props) {
  return (
    <CardBase title={title} color={item.color.rgb}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {Array.from({ length: 4 }, (_, index) => (
          <ItemCard key={index} uniqueID="" isLoading disablePrefetch />
        ))}
      </Flex>
    </CardBase>
  );
}
