import { Flex } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import dynamic from 'next/dynamic';
import Color from 'color';

const Markdown = dynamic(() => import('../Utils/Markdown'));

type Props = {
  item: ItemData;
};

const ItemComments = (props: Props) => {
  const { item } = props;
  const color = Color(item.color.hex);
  if (!item.comment) return null;

  return (
    <CardBase title="Notes" color={item.color.rgb}>
      <Flex
        gap={3}
        flexFlow="column"
        fontSize="sm"
        sx={{
          a: {
            color: color.lightness(70).hex(),
          },
          ul: {
            padding: 'revert',
          },
        }}
      >
        <Markdown>{item.comment}</Markdown>
      </Flex>
    </CardBase>
  );
};

export default ItemComments;
