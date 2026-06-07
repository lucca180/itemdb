import { Flex } from '@chakra-ui/react';
import type { ItemPageData } from '@app/utils/loadItemPage';
import { ItemHeader } from '@app/_components/Item/page/ItemHeader';
import {
  ItemPageAdminOnly,
  ItemPageEditSection,
  ItemPageUserOnly,
} from '@app/_components/Item/page/ItemPageAuthGates';
import { ItemPageOutfitSectionLoader } from '@app/_components/Item/page/ItemPageOutfitSectionLoader';
import { ItemPageWearablePreview } from '@app/_components/Item/page/ItemPageWearablePreview';
import {
  ItemPageManualCheck,
  ItemPageMyLists,
  ItemPageSidebarDesktop,
  ItemPageSidebarMobile,
} from '@app/_components/Item/page/ItemPageClientCards';
import MissingInfoCard from '@components/Items/MissingInfoCard';
import ItemEffectsCard from '@components/Items/ItemEffectsCard';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import NcMallCard from '@components/Items/NCMallCard';
import ItemRestock from '@components/Items/ItemRestockInfo';
import RelatedLinksCard from '@components/Items/RelatedLinks';
import FindAtCard from '@components/Items/FindAtCard';
import ItemInfoCard from '@components/Items/InfoCard';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import { ItemDropsSection } from '@app/_components/Item/Drops/ItemDropsSection';
import MMECard from '@app/_components/Item/MME/MMECard';
import DyeCard from '@app/_components/Item/Dye/DyeCard';
import ItemRecipesCard from '@app/_components/Item/Recipes/ItemRecipesCard';
import { ItemParent } from '@app/_components/Item/ItemParent/ItemParent';
import { SimilarItemsCard } from '@app/_components/Item/SimilarItems/SimilarItemsCard';
import PetpetCard from '@app/_components/Item/Petpet/PetpetCard';
import ItemCommentsCard from '@app/_components/Item/Comments/ItemCommentsCard';
import ItemAvyCard from '@app/_components/Item/Avy/ItemAvyCard';
import TradeCardSection from '@app/_components/Item/Trade/TradeCardSection';
import NCTradeSection from '@app/_components/Item/NCTrade/NCTradeSection';
import ItemPriceSection from '@app/_components/Item/Price/ItemPriceSection';
import { getTranslations } from 'next-intl/server';

type ItemPageProps = {
  data: ItemPageData;
};

export async function ItemPage({ data }: ItemPageProps) {
  const {
    item,
    lists,
    tradeLists,
    itemEffects,
    colors,
    ncMallData,
    wearableData,
    ncTradeInsights,
    npPrices,
    npPriceStatus,
  } = data;

  const t = await getTranslations();
  const editSectionLabels = {
    reportError: t('ItemPage.report-error'),
    edit: t('Button.edit'),
  };

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
          <ItemPageEditSection item={item} itemEffects={itemEffects} labels={editSectionLabels} />
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
            {!item.isNC && (
              <ItemPriceSection
                key={getKey('price')}
                item={item}
                prices={npPrices}
                priceStatus={npPriceStatus}
                lists={lists}
              />
            )}
            {item.isNC && (
              <NCTradeSection
                key={getKey('nc-trade')}
                item={item}
                tradeLists={tradeLists}
                insights={ncTradeInsights}
              />
            )}
            {itemEffects.length > 0 && (
              <ItemEffectsCard key={getKey('item-effects')} item={item} effects={itemEffects} />
            )}
            {lists && (
              <ItemOfficialLists key={getKey('official-lists')} item={item} lists={lists} />
            )}
            <ItemPageUserOnly>
              <ItemPageMyLists item={item} itemKey={itemKey} />
            </ItemPageUserOnly>
            <MMECard key={getKey('mme-card')} item={item} />
            <DyeCard key={getKey('dye-card')} item={item} />
            <ItemRecipesCard key={getKey('item-recipes')} item={item} />
            <PetpetCard key={getKey('petpet-card')} item={item} />
            {item.comment && <ItemCommentsCard key={getKey('item-comments')} item={item} />}
            <ItemDropsSection key={getKey('item-drops')} item={item} />
            <SimilarItemsCard key={getKey('similar-items')} item={item} />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            {item.isNC && ncMallData && (
              <NcMallCard key={getKey('nc-mall-card')} item={item} ncMallData={ncMallData} />
            )}
            {item.findAt.restockShop && <ItemRestock key={getKey('item-restock')} item={item} />}
            <ItemPageOutfitSectionLoader item={item} />
            <ItemPageWearablePreview
              item={item}
              itemEffects={itemEffects}
              wearableData={wearableData}
            />
            <ItemAvyCard key={getKey('item-avy-card')} item={item} />
            <ItemParent key={getKey('item-parent')} item={item} />
            <TradeCardSection key={getKey('trade-card')} item={item} />
            <RelatedLinksCard
              key={getKey('related-links')}
              item={item}
              itemEffects={itemEffects}
              lists={lists}
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
