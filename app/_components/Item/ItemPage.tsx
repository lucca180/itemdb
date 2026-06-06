import { Flex } from '@chakra-ui/react';
import type { ItemPageData } from '@app/utils/itemPage';
import { ItemHeader } from '@app/_components/Item/ItemHeader';
import {
  ItemPageAdminOnly,
  ItemPageEditSection,
  ItemPageUserOnly,
} from '@app/_components/Item/ItemPageAuthGates';
import { ItemPageOutfitSection } from '@app/_components/Item/ItemPageOutfitSection';
import { ItemPageWearablePreview } from '@app/_components/Item/ItemPageWearablePreview';
import {
  ItemPageAvyCard,
  ItemPageBdCard,
  ItemPageMainColumn,
  ItemPageMainColumnExtras,
  ItemPageManualCheck,
  ItemPageMyLists,
  ItemPageParentCard,
  ItemPageSidebarDesktop,
  ItemPageSidebarMobile,
  ItemPageTradeCard,
} from '@app/_components/Item/ItemPageClientCards';
import MissingInfoCard from '@components/Items/MissingInfoCard';
import ItemEffectsCard from '@components/Items/ItemEffectsCard';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import NcMallCard from '@components/Items/NCMallCard';
import ItemRestock from '@components/Items/ItemRestockInfo';
import RelatedLinksCard from '@components/Items/RelatedLinks';
import FindAtCard from '@components/Items/FindAtCard';
import ItemInfoCard from '@components/Items/InfoCard';
import ColorInfoCard from '@components/Items/ColorInfoCard';

type ItemPageProps = {
  data: ItemPageData;
};

export async function ItemPage({ data }: ItemPageProps) {
  const {
    item,
    lists,
    tradeLists,
    itemOpenable,
    itemParent,
    NPTrades: trades,
    itemEffects,
    itemRecipes,
    mmeData,
    dyeData,
    petpetData,
    ncInsights,
    avyData,
    colors,
    lastSeen,
    similarItems,
    bdData,
    ncMallData,
    wearableData,
  } = data;

  const itemKey = item.internal_id;
  const getKey = (str: string) => itemKey + str;

  return (
    <>
      <ItemHeader item={item} lists={lists} />
      <Flex
        minH="500px"
        gap={6}
        mt={5}
        flexFlow={{ base: 'column-reverse', lg: 'row' }}
        alignItems={{ base: 'center', lg: 'inherit' }}
      >
        <Flex
          flex="1"
          maxW={{ base: '100vh', lg: '275px' }}
          w={{ base: '100%', lg: 'auto' }}
          minW="250px"
          flexFlow="column"
          gap={5}
        >
          <ItemPageSidebarDesktop item={item} itemKey={itemKey}>
            <FindAtCard item={item} />
          </ItemPageSidebarDesktop>
          <ItemInfoCard item={item} />
          {colors && <ColorInfoCard colors={colors} />}
          <ItemPageEditSection
            item={item}
            itemOpenable={itemOpenable}
            itemEffects={itemEffects}
            petpetData={petpetData}
          />
        </Flex>
        <Flex
          flex="3"
          gap={{ base: 4, md: 6 }}
          flexFlow={{ base: 'column', xl: 'row' }}
          maxW={{ base: '100vh', md: 'none' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Flex flex="2" flexFlow="column" gap={{ base: 4, md: 6 }} maxW="800px">
            <ItemPageAdminOnly>
              <ItemPageManualCheck item={item} itemKey={itemKey} />
            </ItemPageAdminOnly>
            {item.isMissingInfo && <MissingInfoCard key={getKey('missing-info')} />}
            <ItemPageSidebarMobile item={item} itemKey={itemKey}>
              <FindAtCard item={item} />
            </ItemPageSidebarMobile>
            <ItemPageMainColumn
              item={item}
              itemKey={itemKey}
              lastSeen={lastSeen}
              NPPrices={data.NPPrices}
              lists={lists}
              tradeLists={tradeLists}
              ncInsights={ncInsights}
            />
            {itemEffects.length > 0 && (
              <ItemEffectsCard key={getKey('item-effects')} item={item} effects={itemEffects} />
            )}
            {lists && (
              <ItemOfficialLists key={getKey('official-lists')} item={item} lists={lists} />
            )}
            <ItemPageUserOnly>
              <ItemPageMyLists item={item} itemKey={itemKey} />
            </ItemPageUserOnly>
            <ItemPageMainColumnExtras
              item={item}
              itemKey={itemKey}
              mmeData={mmeData}
              dyeData={dyeData}
              petpetData={petpetData}
              itemRecipes={itemRecipes}
              itemOpenable={itemOpenable}
              similarItems={similarItems}
            />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            {bdData && <ItemPageBdCard item={item} itemKey={itemKey} bdData={bdData} />}
            {item.isNC && ncMallData && (
              <NcMallCard key={getKey('nc-mall-card')} item={item} ncMallData={ncMallData} />
            )}
            {item.findAt.restockShop && (
              <ItemRestock key={getKey('item-restock')} item={item} lastSeen={lastSeen} />
            )}
            {itemOpenable && <ItemPageOutfitSection item={item} itemOpenable={itemOpenable} />}
            <ItemPageWearablePreview
              item={item}
              itemEffects={itemEffects}
              wearableData={wearableData}
            />
            {avyData && avyData.length > 0 && (
              <ItemPageAvyCard item={item} itemKey={itemKey} avyData={avyData} />
            )}
            {itemParent.parents_iid.length > 0 && (
              <ItemPageParentCard item={item} itemKey={itemKey} itemParent={itemParent} />
            )}
            {!item.isNC && item.status === 'active' && (
              <ItemPageTradeCard item={item} itemKey={itemKey} trades={trades} />
            )}
            <RelatedLinksCard
              key={getKey('related-links')}
              item={item}
              itemEffects={itemEffects}
              lists={lists}
              petpetData={petpetData}
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
