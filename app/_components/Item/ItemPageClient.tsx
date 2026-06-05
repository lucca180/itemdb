'use client';

import { Badge, Box, Button, Flex, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import FindAtCard from '@components/Items/FindAtCard';
import ItemInfoCard from '@components/Items/InfoCard';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import { FiEdit3 } from 'react-icons/fi';
import type { EditItemModalProps } from '@components/Modal/EditItemModal';
import AddToListSelect from '@components/UserLists/AddToListSelect';
import MainLink from '@components/Utils/MainLink';
import SimilarItemsCard from '@components/Items/SimilarItemsCard';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { ItemBreadcrumb } from '@components/Breadcrumbs/ItemBreadcrumb';
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

  const color = item?.color.rgb ?? [255, 255, 255];
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
      <Box>
        <Box
          position="absolute"
          h="45vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.5) 80%)`}
          zIndex={-1}
        />
        <Box pt={2}>
          <ItemBreadcrumb item={item} officialLists={lists} useAppDir />
        </Box>
        <Flex gap={{ base: 4, md: 8 }} pt={4} alignItems="center">
          <Flex
            position="relative"
            p={2}
            bg={`rgba(${color[0]},${color[1]}, ${color[2]},.4)`}
            borderRadius="md"
            flexFlow="column"
            justifyContent="center"
            gap={2}
            alignItems="center"
            textAlign="center"
            flex="0 0 auto"
            minW="100px"
            minH="100px"
          >
            <Image src={item.image} width={80} height={80} alt="" unoptimized />
          </Flex>
          <Box>
            <Stack direction="row" mb={1} wrap="wrap" gap={0.5}>
              <Badge borderRadius="md" asChild>
                <MainLink
                  prefetch={false}
                  href={`/search?s=&category[]=${item.category ?? 'Unknown'}`}
                >
                  {item.category ?? '???'}
                </MainLink>
              </Badge>
              {item.type === 'np' && (
                <Badge colorPalette="green" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=np">
                    NP
                  </MainLink>
                </Badge>
              )}
              {item.type === 'nc' && (
                <Badge colorPalette="purple" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=nc">
                    NC
                  </MainLink>
                </Badge>
              )}
              {item.type === 'pb' && (
                <Badge colorPalette="yellow" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=pb">
                    PB
                  </MainLink>
                </Badge>
              )}
              {item.isWearable && (
                <Badge colorPalette="blue" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=wearable">
                    {t('General.wearable')}
                  </MainLink>
                </Badge>
              )}
              {item.isNeohome && (
                <Badge colorPalette="cyan" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=neohome">
                    {t('General.neohome')}
                  </MainLink>
                </Badge>
              )}
              {item.isBD && (
                <Badge colorPalette="red" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=battledome">
                    {t('General.battledome')}
                  </MainLink>
                </Badge>
              )}
              {item.useTypes.canEat === 'true' && (
                <Badge colorPalette="orange" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=canEat">
                    {t('General.edible')}
                  </MainLink>
                </Badge>
              )}
              {item.useTypes.canRead === 'true' && (
                <Badge colorPalette="orange" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=canRead">
                    {t('General.readable')}
                  </MainLink>
                </Badge>
              )}
              {item.useTypes.canPlay === 'true' && (
                <Badge colorPalette="orange" borderRadius="md" asChild>
                  <MainLink prefetch={false} href="/search?s=&type[]=canPlay">
                    {t('General.playable')}
                  </MainLink>
                </Badge>
              )}
            </Stack>
            <Heading as="h1" size={{ base: 'lg', md: undefined }} fontWeight={'bold'}>
              {item.name}
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'inherit' }} as="h2">
              {item.description}
            </Text>
          </Box>
        </Flex>
      </Box>

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
