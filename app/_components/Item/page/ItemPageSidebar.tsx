'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Flex, Skeleton } from '@chakra-ui/react';
import type { ItemData } from '@types';

const AddToListSelect = dynamic(() => import('@components/UserLists/AddToListSelect'), {
  loading: () => <Skeleton h="40px" w="100%" borderRadius="md" />,
});

export function ItemPageAddToList({ item }: { item: ItemData }) {
  return (
    <Flex flexFlow="column" w="100%" minW={0}>
      <AddToListSelect item={item} />
    </Flex>
  );
}

export function ItemPageSidebarDesktop({ children }: { children?: ReactNode }) {
  return (
    <Flex flexFlow="column" display={{ base: 'none', lg: 'flex' }} gap={5}>
      {children}
    </Flex>
  );
}

export function ItemPageSidebarMobile({ children }: { children?: ReactNode }) {
  return (
    <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', lg: 'none' }}>
      {children}
    </Flex>
  );
}
