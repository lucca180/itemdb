import { Flex, Link, Tag, Text, List, ListItem } from '@chakra-ui/react';
import React from 'react';
import { ItemData, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import NextLink from 'next/link';
import Image from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';

type Props = {
  item: ItemData;
  lists: UserList[];
};

const ItemOfficialLists = (props: Props) => {
  const { item, lists } = props;
  const officialLists = lists.filter((list) => list.official);

  return (
    <CardBase title={<Link href="/lists/official">Official Lists</Link>} color={item.color.rgb}>
      <Flex gap={3} flexFlow="column">
        <List spacing={3}>
          {officialLists.map((list, i) => (
            <ListItem key={i}>
              <Link as={NextLink} href={`/lists/official/${list.internal_id}`} whiteSpace="nowrap">
                <Tag
                  variant="subtle"
                  size="lg"
                  fontWeight="bold"
                  verticalAlign="middle"
                  display={'inline-flex'}
                  alignItems="center"
                >
                  {list.name}
                  {list.dynamicType && (
                    <Image
                      src={DynamicIcon}
                      alt="dynamic list"
                      width={10}
                      style={{ marginLeft: '5px' }}
                    />
                  )}
                </Tag>
              </Link>
              <Text display="inline" verticalAlign="middle">
                {' '}
                -{' '}
                {
                  (list.description || "This list doesn't have a description yet").split(
                    /[\r\n]+/
                  )[0]
                }
              </Text>
            </ListItem>
          ))}
          {officialLists.length === 0 && (
            <Flex flexFlow="column" gap={2} justifyContent="center" alignItems="center">
              <Text fontSize="sm" color="gray.200">
                This item is not on any official list yet.
              </Text>
            </Flex>
          )}
        </List>
      </Flex>
    </CardBase>
  );
};

export default ItemOfficialLists;
