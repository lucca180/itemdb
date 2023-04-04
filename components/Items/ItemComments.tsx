import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';

type Props = {
  item: ItemData;
};

const ItemComments = (props: Props) => {
  const { item } = props;

  return (
    <CardBase title="Notes" color={item.color.rgb}>
      <Flex gap={3} flexFlow="column">
        <Text fontSize="sm">{item.comment || "This item doesn't have any comments yet"}</Text>
      </Flex>
    </CardBase>
  );
};

export default ItemComments;
