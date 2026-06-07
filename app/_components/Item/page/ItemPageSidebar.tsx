'use client';

import type { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import type { ItemData } from '@types';

export function ItemPageSidebarDesktop({
  item,
  children,
}: {
  item: ItemData;
  children?: ReactNode;
}) {
  return (
    <Flex flexFlow="column" display={{ base: 'none', lg: 'flex' }} gap={5}>
      <AddToListSelect item={item} />
      {children}
    </Flex>
  );
}

export function ItemPageSidebarMobile({
  item,
  children,
}: {
  item: ItemData;
  children?: ReactNode;
}) {
  return (
    <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', lg: 'none' }}>
      <AddToListSelect item={item} />
      {children}
    </Flex>
  );
}
