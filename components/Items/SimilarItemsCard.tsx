import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';

type Props = {
  item: ItemData;
  similarItems: ItemData[];
};

const SimilarItemsCard = (props: Props) => {
  const { item } = props;
  const color = item.color.rgb;

  return (
    <CardBase title="Our Meepits think you might also be interested" color={color}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {props.similarItems.map((item) => (
          <ItemCard key={item.internal_id} item={item} />
        ))}
        {props.similarItems.length === 0 && (
          <Text fontSize="sm">
            Well that must be a very unique item, because we couldn&apos;t find anything like it.
          </Text>
        )}
      </Flex>
    </CardBase>
  );
};

export default SimilarItemsCard;
