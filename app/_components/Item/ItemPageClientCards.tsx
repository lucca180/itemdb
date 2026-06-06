'use client';

import { Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import FindAtCard from '@components/Items/FindAtCard';
import ItemInfoCard from '@components/Items/InfoCard';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import SimilarItemsCard from '@components/Items/SimilarItemsCard';
import ItemBdCard from '@components/Items/ItemBdCard';
import ItemAvyCard from '@components/Items/ItemAvyCard';
import type { ItemPageData } from '@app/utils/itemPage';
import type { DyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import type {
  AvyData,
  BDData,
  FullItemColors,
  InsightsResponse,
  ItemData,
  ItemLastSeen,
  ItemMMEData,
  ItemOpenable,
  ItemPetpetData,
  ItemRecipe,
  PriceData,
  TradeData,
  UserList,
} from '@types';

const ManualCheckCard = dynamic(() => import('@components/Items/ManualCheckCard'));
const ItemPriceCard = dynamic(() => import('@components/Price/ItemPriceCard'));
const NCTrade = dynamic(() => import('@components/NCTrades'));
const ItemMyLists = dynamic(() => import('@components/Items/MyListsCard'));
const ItemComments = dynamic(() => import('@components/Items/ItemComments'));
const ItemDrops = dynamic(() => import('@components/Items/ItemDrops'));
const ItemParent = dynamic(() => import('@components/Items/ItemParent'));
const TradeCard = dynamic(() => import('@components/Trades/TradeCard'));
const ItemRecipes = dynamic(() => import('@components/Items/ItemRecipes'));
const MMECard = dynamic(() => import('@components/Items/MMECard'));
const DyeCard = dynamic(() => import('@components/Items/DyeCard'));
const PetpetCard = dynamic(() => import('@components/Items/PetpetCard'));

function cardKey(itemKey: number, suffix: string) {
  return `${itemKey}${suffix}`;
}

export function ItemPageSidebarDesktop({ item, itemKey }: { item: ItemData; itemKey: number }) {
  return (
    <Flex flexFlow="column" display={{ base: 'none', lg: 'flex' }} gap={5}>
      <AddToListSelect key={cardKey(itemKey, 'add-to-list')} item={item} />
      <FindAtCard key={cardKey(itemKey, 'find-at')} item={item} />
    </Flex>
  );
}

export function ItemPageSidebarMobile({ item, itemKey }: { item: ItemData; itemKey: number }) {
  return (
    <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', lg: 'none' }}>
      <AddToListSelect key={cardKey(itemKey, 'add-to-list')} item={item} />
      <FindAtCard key={cardKey(itemKey, 'find-at')} item={item} />
    </Flex>
  );
}

export function ItemPageItemInfo({
  item,
  colors,
  itemKey,
}: {
  item: ItemData;
  colors: FullItemColors;
  itemKey: number;
}) {
  return (
    <>
      <ItemInfoCard key={cardKey(itemKey, 'item-info')} item={item} />
      {colors && <ColorInfoCard key={cardKey(itemKey, 'color-info')} colors={colors} />}
    </>
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
  mmeData,
  dyeData,
  petpetData,
  itemRecipes,
  itemOpenable,
  similarItems,
}: {
  item: ItemData;
  itemKey: number;
  mmeData: ItemMMEData | null;
  dyeData: DyeworksData | null;
  petpetData: ItemPetpetData | null;
  itemRecipes: ItemRecipe[] | null;
  itemOpenable: ItemOpenable | null;
  similarItems: ItemData[];
}) {
  return (
    <>
      {mmeData && <MMECard key={cardKey(itemKey, 'mme-card')} item={item} mmeData={mmeData} />}
      {dyeData && <DyeCard key={cardKey(itemKey, 'dye-card')} item={item} dyeData={dyeData} />}
      {petpetData && (
        <PetpetCard key={cardKey(itemKey, 'petpet-card')} item={item} petpetData={petpetData} />
      )}
      {itemRecipes && itemRecipes.length > 0 && (
        <ItemRecipes key={cardKey(itemKey, 'item-recipes')} item={item} recipes={itemRecipes} />
      )}
      {item.comment && <ItemComments key={cardKey(itemKey, 'item-comments')} item={item} />}
      {itemOpenable && (
        <ItemDrops key={cardKey(itemKey, 'item-drops')} item={item} itemOpenable={itemOpenable} />
      )}
      <SimilarItemsCard
        key={cardKey(itemKey, 'similar-items')}
        item={item}
        similarItems={similarItems}
      />
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

export function ItemPageParentCard({
  item,
  itemKey,
  itemParent,
}: {
  item: ItemData;
  itemKey: number;
  itemParent: ItemPageData['itemParent'];
}) {
  return <ItemParent key={cardKey(itemKey, 'item-parent')} item={item} parent={itemParent} />;
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
