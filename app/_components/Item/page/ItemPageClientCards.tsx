'use client';

import type { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import type { ItemData, ItemLastSeen, PriceData, UserList } from '@types';

const ManualCheckCard = dynamic(() => import('@components/Items/ManualCheckCard'));
const ItemPriceCard = dynamic(() => import('@components/Price/ItemPriceCard'));
const ItemMyLists = dynamic(() => import('@components/Items/MyListsCard'));

function cardKey(itemKey: number, suffix: string) {
  return `${itemKey}${suffix}`;
}

export function ItemPageSidebarDesktop({
  item,
  itemKey,
  children,
}: {
  item: ItemData;
  itemKey: number;
  children?: ReactNode;
}) {
  return (
    <Flex flexFlow="column" display={{ base: 'none', lg: 'flex' }} gap={5}>
      <AddToListSelect key={cardKey(itemKey, 'add-to-list')} item={item} />
      {children}
    </Flex>
  );
}

export function ItemPageSidebarMobile({
  item,
  itemKey,
  children,
}: {
  item: ItemData;
  itemKey: number;
  children?: ReactNode;
}) {
  return (
    <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', lg: 'none' }}>
      <AddToListSelect key={cardKey(itemKey, 'add-to-list')} item={item} />
      {children}
    </Flex>
  );
}

export function ItemPageManualCheck({ item, itemKey }: { item: ItemData; itemKey: number }) {
  return <ManualCheckCard key={cardKey(itemKey, 'manual-check')} item={item} />;
}

export function ItemPageMainColumn({
  item,
  itemKey,
  lastSeen,
  NPPrices,
  lists,
  tradeLists,
}: {
  item: ItemData;
  itemKey: number;
  lastSeen: ItemLastSeen | null;
  NPPrices: PriceData[];
  lists?: UserList[];
  tradeLists?: UserList[];
}) {
  return (
    <ItemPriceCard
      key={cardKey(itemKey, 'price-card')}
      item={item}
      lastSeen={lastSeen}
      prices={NPPrices}
      lists={lists}
      tradeLists={tradeLists}
    />
  );
}

export function ItemPageMyLists({ item, itemKey }: { item: ItemData; itemKey: number }) {
  return <ItemMyLists key={cardKey(itemKey, 'my-lists')} item={item} />;
}
