import { Flex, Link, Tag, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import NextLink from 'next/link';

type Props = {
  item: ItemData;
  lists: UserList[];
};

const ItemOfficialLists = (props: Props) => {
  const { item, lists } = props;

  return (
    <CardBase title="Official Lists" color={item.color.rgb}>
      <Flex gap={3} flexFlow="column">
        {lists.map((list, i) => (
          <Flex alignItems="center" key={i} gap={1}>
            <Link as={NextLink} href={`/lists/official/${list.internal_id}`}>
              <Tag variant="subtle" size="lg" fontWeight="bold">
                {list.name}
              </Tag>
            </Link>
            <Text>- {list.description || "This list doesn't have a description yet"}</Text>
          </Flex>
        ))}
        {lists.length === 0 && (
          <Flex flexFlow="column" gap={2} justifyContent="center" alignItems="center">
            <Text fontSize="sm" color="gray.200">
              This item is not on any official list yet.
            </Text>
          </Flex>
        )}
      </Flex>
    </CardBase>
  );
};

export default ItemOfficialLists;
