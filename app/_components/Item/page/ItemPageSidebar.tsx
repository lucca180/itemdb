'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Flex, Skeleton } from '@chakra-ui/react';
import type { ItemData } from '@types';

const AddToListSelect = dynamic(() => import('@components/UserLists/AddToListSelect'), {
  loading: () => <Skeleton h="40px" w="100%" borderRadius="md" />,
});

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
