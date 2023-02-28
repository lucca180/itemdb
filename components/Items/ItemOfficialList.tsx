import { Button, Flex, Tag, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemTag } from '../../types';
import CardBase from '../Card/CardBase';

type Props = {
  item: ItemData;
};

const ItemOfficialLists = (props: Props) => {
  const { item } = props;

  return (
    <CardBase title="Official Lists" color={item.color.rgb}>
      <Flex gap={3} flexFlow="column">
        {/* {tagsFiltered.map((tag, i) => (
          <Flex alignItems="center" key={i} gap={1}>
            <Tag variant="subtle" size="lg" fontWeight="bold">
              {tag.name}
            </Tag>
            <Text>
              -{' '}
              {tag.description ||
                "This category doesn't have a description yet"}
            </Text>
          </Flex>
        ))}
        {tagsFiltered.length === 0 && (
          <Flex
            flexFlow="column"
            gap={2}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize="sm" color="gray.200">
              This item is not on any official list yet.
              
            </Text>
          </Flex>
        )} */}
      </Flex>
    </CardBase>
  );
};

export default ItemOfficialLists;
