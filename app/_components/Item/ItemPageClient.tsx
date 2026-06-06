'use client';

import { Button, Flex, Icon } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import FindAtCard from '@components/Items/FindAtCard';
import ItemInfoCard from '@components/Items/InfoCard';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import { FiEdit3 } from 'react-icons/fi';
import type { EditItemModalProps } from '@components/Modal/EditItemModal';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import SimilarItemsCard from '@components/Items/SimilarItemsCard';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import RelatedLinksCard from '@components/Items/RelatedLinks';
import ItemBdCard from '@components/Items/ItemBdCard';
import ItemAvyCard from '@components/Items/ItemAvyCard';
import type { ItemPageData } from '@app/utils/itemPage';

const EditItemModal = dynamic<EditItemModalProps>(() => import('@components/Modal/EditItemModal'));

const ManualCheckCard = dynamic(() => import('@components/Items/ManualCheckCard'));
const MissingInfoCard = dynamic(() => import('@components/Items/MissingInfoCard'));
const ItemPriceCard = dynamic(() => import('@components/Price/ItemPriceCard'));
const NCTrade = dynamic(() => import('@components/NCTrades'));
const ItemEffectsCard = dynamic(() => import('@components/Items/ItemEffectsCard'));
const ItemMyLists = dynamic(() => import('@components/Items/MyListsCard'));
const ItemComments = dynamic(() => import('@components/Items/ItemComments'));
const ItemDrops = dynamic(() => import('@components/Items/ItemDrops'));
const ItemParent = dynamic(() => import('@components/Items/ItemParent'));
const TradeCard = dynamic(() => import('@components/Trades/TradeCard'));
const ItemRestock = dynamic(() => import('@components/Items/ItemRestockInfo'));
const ItemPreview = dynamic(() => import('@components/Items/ItemPreview'));
const ItemRecipes = dynamic(() => import('@components/Items/ItemRecipes'));
const MMECard = dynamic(() => import('@components/Items/MMECard'));
const DyeCard = dynamic(() => import('@components/Items/DyeCard'));
const NcMallCard = dynamic(() => import('@components/Items/NCMallCard'));
const PetpetCard = dynamic(() => import('@components/Items/PetpetCard'));
const ItemOutfit = dynamic(() => import('@components/Items/ItemOutfit'));

const isPetDayCapsule = (name: string) => /Day Y\d+ Mini Mystery Capsule/i.test(name);

export function ItemPageClient(props: ItemPageData) {
  const t = useTranslations();
  const {
    item,
    colors,
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
  } = props;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();

  const colorSpeciesEffect = useMemo(() => {
    if (itemEffects.length === 0) return null;
    return itemEffects.find((effect) => effect.type === 'colorSpecies');
  }, [itemEffects]);

  const getKey = (str: string) => item.internal_id + str;

  return (
    <>
      {item && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          itemOpenable={itemOpenable}
          itemEffects={itemEffects}
          petpetData={petpetData}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          tags={[]}
        />
      )}

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
          <Flex flexFlow="column" display={{ base: 'none', lg: 'flex' }} gap={5}>
            <AddToListSelect key={getKey('add-to-list')} item={item} />
            <FindAtCard key={getKey('find-at')} item={item} />
          </Flex>

          <ItemInfoCard key={getKey('item-info')} item={item} />
          {colors && <ColorInfoCard key={getKey('color-info')} colors={colors} />}
          <Flex justifyContent="center" gap={1}>
            <FeedbackButton colorPalette="red" variant={'ghost'}>
              {t('ItemPage.report-error')}
            </FeedbackButton>
            {user?.isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Icon as={FiEdit3} mr={1} /> {t('Button.edit')}
              </Button>
            )}
          </Flex>
        </Flex>
        <Flex
          flex="3"
          gap={{ base: 4, md: 6 }}
          flexFlow={{ base: 'column', xl: 'row' }}
          maxW={{ base: '100vh', md: 'none' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Flex flex="2" flexFlow="column" gap={{ base: 4, md: 6 }} maxW="800px">
            {user && user.isAdmin && <ManualCheckCard key={getKey('manual-check')} item={item} />}
            {item.isMissingInfo && <MissingInfoCard key={getKey('missing-info')} />}

            <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', lg: 'none' }}>
              <AddToListSelect key={getKey('add-to-list')} item={item} />
              <FindAtCard key={getKey('find-at')} item={item} />
            </Flex>

            {!item.isNC && (
              <ItemPriceCard
                key={getKey('price-card')}
                item={item}
                lastSeen={props.lastSeen}
                prices={props.NPPrices}
                lists={props.lists}
                tradeLists={tradeLists}
              />
            )}
            {item.isNC && (
              <NCTrade
                key={getKey('nc-trade')}
                item={item}
                lists={tradeLists}
                insights={ncInsights}
              />
            )}
            {itemEffects.length > 0 && (
              <ItemEffectsCard key={getKey('item-effects')} item={item} effects={itemEffects} />
            )}
            {lists && (
              <ItemOfficialLists key={getKey('official-lists')} item={item} lists={lists} />
            )}
            {!!user && <ItemMyLists key={getKey('my-lists')} item={item} />}
            {mmeData && <MMECard key={getKey('mme-card')} item={item} mmeData={mmeData} />}
            {dyeData && <DyeCard key={getKey('dye-card')} item={item} dyeData={dyeData} />}
            {petpetData && (
              <PetpetCard key={getKey('petpet-card')} item={item} petpetData={petpetData} />
            )}
            {itemRecipes && itemRecipes.length > 0 && (
              <ItemRecipes key={getKey('item-recipes')} item={item} recipes={itemRecipes} />
            )}
            {item.comment && <ItemComments key={getKey('item-comments')} item={item} />}
            {itemOpenable && (
              <ItemDrops key={getKey('item-drops')} item={item} itemOpenable={itemOpenable} />
            )}
            <SimilarItemsCard
              key={getKey('similar-items')}
              item={item}
              similarItems={props.similarItems}
            />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            {props.bdData && (
              <ItemBdCard key={getKey('item-bd-card')} item={item} bdData={props.bdData} />
            )}
            {item.isNC && props.ncMallData && (
              <NcMallCard key={getKey('nc-mall-card')} item={item} ncMallData={props.ncMallData} />
            )}
            {item.findAt.restockShop && (
              <ItemRestock key={getKey('item-restock')} item={item} lastSeen={props.lastSeen} />
            )}
            {!item.isWearable && itemOpenable && isPetDayCapsule(item.name) && (
              <ItemOutfit
                key={getKey('item-outfit')}
                outfitList={Object.keys(itemOpenable.drops).map((iid) => parseInt(iid))}
                item={item}
              />
            )}
            {(item.isWearable || colorSpeciesEffect) && (
              <ItemPreview
                key={getKey('item-preview')}
                colorSpeciesEffect={colorSpeciesEffect}
                item={item}
                wearableData={props.wearableData}
              />
            )}
            {avyData && avyData.length > 0 && (
              <ItemAvyCard key={getKey('item-avy-card')} item={item} avyData={avyData} />
            )}
            {itemParent.parents_iid.length > 0 && (
              <ItemParent key={getKey('item-parent')} item={item} parent={itemParent} />
            )}
            {!item.isNC && item.status === 'active' && (
              <TradeCard key={getKey('trade-card')} item={item} trades={trades} />
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
