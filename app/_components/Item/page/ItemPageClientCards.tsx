'use client';

import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import ItemBdCard from '@components/Items/ItemBdCard';
import ItemAvyCard from '@components/Items/ItemAvyCard';
import type {
  AvyData,
  BDData,
  InsightsResponse,
  ItemData,
  ItemLastSeen,
  ItemPetpetData,
  PriceData,
  TradeData,
  UserList,
} from '@types';

const ManualCheckCard = dynamic(() => import('@components/Items/ManualCheckCard'));
const ItemPriceCard = dynamic(() => import('@components/Price/ItemPriceCard'));
const NCTrade = dynamic(() => import('@components/NCTrades'));
const ItemMyLists = dynamic(() => import('@components/Items/MyListsCard'));
const ItemComments = dynamic(() => import('@components/Items/ItemComments'));
const TradeCard = dynamic(() => import('@components/Trades/TradeCard'));
const PetpetCard = dynamic(() => import('@components/Items/PetpetCard'));

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
  ncInsights,
}: {
  item: ItemData;
  itemKey: number;
  lastSeen: ItemLastSeen | null;
  NPPrices: PriceData[];
  lists?: UserList[];
  tradeLists?: UserList[];
  ncInsights: InsightsResponse | null;
}) {
  return (
    <>
      {!item.isNC && (
        <ItemPriceCard
          key={cardKey(itemKey, 'price-card')}
          item={item}
          lastSeen={lastSeen}
          prices={NPPrices}
          lists={lists}
          tradeLists={tradeLists}
        />
      )}
      {item.isNC && (
        <NCTrade
          key={cardKey(itemKey, 'nc-trade')}
          item={item}
          lists={tradeLists}
          insights={ncInsights}
        />
      )}
    </>
  );
}

export function ItemPageMyLists({ item, itemKey }: { item: ItemData; itemKey: number }) {
  return <ItemMyLists key={cardKey(itemKey, 'my-lists')} item={item} />;
}

export function ItemPageMainColumnExtras({
  item,
  itemKey,
  petpetData,
}: {
  item: ItemData;
  itemKey: number;
  petpetData: ItemPetpetData | null;
}) {
  return (
    <>
      {petpetData && (
        <PetpetCard key={cardKey(itemKey, 'petpet-card')} item={item} petpetData={petpetData} />
      )}
      {item.comment && <ItemComments key={cardKey(itemKey, 'item-comments')} item={item} />}
    </>
  );
}

export function ItemPageBdCard({
  item,
  itemKey,
  bdData,
}: {
  item: ItemData;
  itemKey: number;
  bdData: BDData;
}) {
  return <ItemBdCard key={cardKey(itemKey, 'item-bd-card')} item={item} bdData={bdData} />;
}

export function ItemPageAvyCard({
  item,
  itemKey,
  avyData,
}: {
  item: ItemData;
  itemKey: number;
  avyData: AvyData[];
}) {
  return <ItemAvyCard key={cardKey(itemKey, 'item-avy-card')} item={item} avyData={avyData} />;
}

export function ItemPageTradeCard({
  item,
  itemKey,
  trades,
}: {
  item: ItemData;
  itemKey: number;
  trades: TradeData[];
}) {
  return <TradeCard key={cardKey(itemKey, 'trade-card')} item={item} trades={trades} />;
}
