import { Badge, Box, Button, Flex, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import React, { ReactElement, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import Image from 'next/image';
import {
  AvyData,
  BDData,
  FullItemColors,
  InsightsResponse,
  ItemData,
  ItemEffect,
  ItemLastSeen,
  ItemMMEData,
  ItemOpenable,
  ItemPetpetData,
  ItemRecipe,
  NCMallData,
  // ItemTag,
  PriceData,
  TradeData,
  UserList,
  WearableData,
} from '../../types';
import FindAtCard from '../../components/Items/FindAtCard';
import ItemInfoCard from '../../components/Items/InfoCard';
import ColorInfoCard from '../../components/Items/ColorInfoCard';
import ItemOfficialLists from '../../components/Items/ItemOfficialList';
// import ItemTags from '../../components/Items/ItemTags';
import { FiEdit3 } from 'react-icons/fi';
import type { EditItemModalProps } from '../../components/Modal/EditItemModal';
import AddToListSelect from '../../components/UserLists/AddToListSelect';
import { GetStaticPropsContext } from 'next';
import { getItem } from '../api/v1/items/[id_name]';
import { getItemLists } from '../api/v1/items/[id_name]/lists';
import Link from 'next/link';
import { getSimilarItems } from '../api/v1/items/[id_name]/similar';
import SimilarItemsCard from '../../components/Items/SimilarItemsCard';
import { getItemDrops, getItemParent } from '../api/v1/items/[id_name]/drops';
import dynamic from 'next/dynamic';
import { getItemPrices } from '../api/v1/items/[id_name]/prices';
import { getItemTrades } from '../api/v1/trades';
import { getLastSeen } from '../api/v1/prices/stats';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../utils/auth';
import { getItemEffects } from '../api/v1/items/[id_name]/effects';
import { getWearableData } from '../api/v1/items/[id_name]/wearable';
import { getItemNCMall } from '../api/v1/items/[id_name]/ncmall';
import { getItemRecipes } from '../api/v1/items/[id_name]/recipes';
import { NextPageWithLayout } from '../_app';
import { getMMEData, isMME } from '../api/v1/items/[id_name]/mme';
import { DyeworksData, getDyeworksData } from '../api/v1/items/[id_name]/dyeworks';
import { getSingleItemColor } from '../api/v1/items/[id_name]/colors';
import * as Sentry from '@sentry/nextjs';
import { getPetpetData } from '../api/v1/items/[id_name]/petpet';
import { ItemBreadcrumb } from '../../components/Breadcrumbs/ItemBreadcrumb';
import { loadTranslation } from '@utils/load-translation';
import { getNCTradeInsights } from '../api/v1/mall/[iid]/insights';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import RelatedLinksCard from '@components/Items/RelatedLinks';
import { shouldShowTradeLists } from '@utils/utils';
import ItemBdCard from '@components/Items/ItemBdCard';
import { getBDData } from '../api/v1/items/[id_name]/bd';
import { getAvyData } from '../api/v1/items/[id_name]/avys';
import ItemAvyCard from '@components/Items/ItemAvyCard';

const EditItemModal = dynamic<EditItemModalProps>(
  () => import('../../components/Modal/EditItemModal')
);

const ManualCheckCard = dynamic(() => import('../../components/Items/ManualCheckCard'));
const MissingInfoCard = dynamic(() => import('../../components/Items/MissingInfoCard'));
const ItemPriceCard = dynamic(() => import('../../components/Price/ItemPriceCard'));
const NCTrade = dynamic(() => import('../../components/NCTrades'));
const ItemEffectsCard = dynamic(() => import('../../components/Items/ItemEffectsCard'));
// const ItemOfficialLists = dynamic(() => import('../../components/Items/ItemOfficialList'));
const ItemMyLists = dynamic(() => import('../../components/Items/MyListsCard'));
const ItemComments = dynamic(() => import('../../components/Items/ItemComments'));
const ItemDrops = dynamic(() => import('../../components/Items/ItemDrops'));
const ItemParent = dynamic(() => import('../../components/Items/ItemParent'));
const TradeCard = dynamic(() => import('../../components/Trades/TradeCard'));
const ItemRestock = dynamic(() => import('../../components/Items/ItemRestockInfo'));
const ItemPreview = dynamic(() => import('../../components/Items/ItemPreview'));
const ItemRecipes = dynamic(() => import('../../components/Items/ItemRecipes'));
const MMECard = dynamic(() => import('../../components/Items/MMECard'));
const DyeCard = dynamic(() => import('../../components/Items/DyeCard'));
const NcMallCard = dynamic(() => import('../../components/Items/NCMallCard'));
const PetpetCard = dynamic(() => import('../../components/Items/PetpetCard'));
const ItemOutfit = dynamic(() => import('../../components/Items/ItemOutfit'));

type ItemPageProps = {
  item: ItemData;
  colors: FullItemColors;
  similarItems: ItemData[];
  lists?: UserList[];
  tradeLists?: UserList[];
  avyData: AvyData[] | null;
  itemOpenable: ItemOpenable | null;
  itemParent: {
    parents_iid: number[];
    itemData: ItemData[];
  };
  lastSeen: ItemLastSeen | null;
  NPTrades: TradeData[];
  NPPrices: PriceData[];
  itemEffects: ItemEffect[];
  wearableData: WearableData | null;
  ncMallData: NCMallData | null;
  itemRecipes: ItemRecipe[] | null;
  mmeData: ItemMMEData | null;
  dyeData: DyeworksData | null;
  petpetData: ItemPetpetData | null;
  ncInsights: InsightsResponse | null;
  bdData: BDData | null;
  messages: any;
  locale: string | undefined;
};

const ItemPage: NextPageWithLayout<ItemPageProps> = (props: ItemPageProps) => {
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
          <ItemBreadcrumb item={item} officialLists={lists} />
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
            boxShadow="sm"
            textAlign="center"
            flex="0 0 auto"
            minW="100px"
            minH="100px"
          >
            <Image src={item.image} width={80} height={80} alt={item.name} unoptimized />
          </Flex>
          <Box>
            <Stack direction="row" mb={1} wrap="wrap" gap={0.5}>
              {
                <Badge
                  as={Link}
                  prefetch={false}
                  borderRadius="md"
                  href={`/search?s=&category[]=${item.category ?? 'Unknown'}`}
                >
                  {item.category ?? '???'}
                </Badge>
              }
              {item.type === 'np' && (
                <Badge
                  colorScheme="green"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=np"
                >
                  NP
                </Badge>
              )}
              {item.type === 'nc' && (
                <Badge
                  colorScheme="purple"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=nc"
                >
                  NC
                </Badge>
              )}
              {item.type === 'pb' && (
                <Badge
                  colorScheme="yellow"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=pb"
                >
                  PB
                </Badge>
              )}
              {item.isWearable && (
                <Badge
                  colorScheme="blue"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=wearable"
                >
                  {t('General.wearable')}
                </Badge>
              )}
              {item.isNeohome && (
                <Badge
                  colorScheme="cyan"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=neohome"
                >
                  {t('General.neohome')}
                </Badge>
              )}
              {item.isBD && (
                <Badge
                  colorScheme="red"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=battledome"
                >
                  {t('General.battledome')}
                </Badge>
              )}
              {item.useTypes.canEat === 'true' && (
                <Badge
                  colorScheme="orange"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=canEat"
                >
                  {t('General.edible')}
                </Badge>
              )}
              {item.useTypes.canRead === 'true' && (
                <Badge
                  colorScheme="orange"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=canRead"
                >
                  {t('General.readable')}
                </Badge>
              )}
              {item.useTypes.canPlay === 'true' && (
                <Badge
                  colorScheme="orange"
                  borderRadius="md"
                  as={Link}
                  prefetch={false}
                  href="/search?s=&type[]=canPlay"
                >
                  {t('General.playable')}
                </Badge>
              )}
            </Stack>
            <Heading as="h1" size={{ base: 'lg', md: undefined }}>
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
          {/* <ItemTags toggleModal={() => setIsEditModalOpen(true)} item={item} tags={tags} /> */}
          <Flex justifyContent="center" gap={1}>
            <FeedbackButton colorScheme="red" variant={'ghost'}>
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
};

export default ItemPage;

export async function getStaticProps(context: GetStaticPropsContext) {
  const id = context.params?.id as string | undefined;
  if (!id) return { notFound: true };
  let item;

  const isIdNumber = !isNaN(Number(id));

  if (isIdNumber) {
    item = await getItem(Number(id), true);
    if (!item) return { notFound: true };

    if (item.slug)
      return {
        redirect: {
          destination: `/item/${item.slug}`,
          permanent: true,
        },
      };
  } else item = await getItem(id, true);

  if (!item) return { notFound: true };

  if (id !== item.slug)
    return {
      redirect: {
        destination: `/item/${item.slug}`,
        permanent: true,
      },
    };

  const [
    colors,
    lists,
    similarItems,
    tradeLists,
    itemOpenable,
    itemParent,
    itemPrices,
    NPTrades,
    lastSeen,
    itemEffects,
    wearableData,
    NCMallData,
    itemRecipes,
    mmeData,
    dyeData,
    petpetData,
    ncInsights,
    bdData,
    avyData,
  ] = await Sentry.startSpan(
    {
      name: 'itemLoad',
      attributes: {
        itemName: item.name,
        item_iid: item.internal_id,
        isWearable: item.isWearable,
        isNC: item.isNC,
      },
      forceTransaction: true,
    },
    async () => {
      return Promise.all([
        getSingleItemColor(item), //0
        getItemLists(item.internal_id, true), // 1
        getSimilarItems(item), // 2
        shouldShowTradeLists(item) ? getItemLists(item.internal_id, false) : [], // 3
        item.useTypes.canOpen !== 'false' ? getItemDrops(item.internal_id, item.isNC) : null, // 4
        getItemParent(item.internal_id, 4), // 5
        !item.isNC ? getItemPrices({ iid: item.internal_id, includeUnconfirmed: true }) : [], // 6
        !item.isNC ? getItemTrades({ item_iid: item.internal_id }) : [], // 7
        !item.isNC
          ? getLastSeen({ item_id: item.item_id, name: item.name, image_id: item.image_id })
          : null, // 8
        getItemEffects(item), // 9
        item.isWearable ? (getWearableData(item.internal_id) as Promise<WearableData>) : null, // 10
        item.isNC ? getItemNCMall(item.internal_id) : null, // 11
        !item.isNC ? getItemRecipes(item.internal_id) : null, // 12
        isMME(item.name) ? getMMEData(item) : null, // 13
        item.isNC && item.isWearable ? getDyeworksData(item) : null, // 14
        !item.isNC && !item.isWearable && !item.isBD && !item.isNeohome
          ? getPetpetData(item)
          : null, // 15
        item.isNC ? getNCTradeInsights(item.internal_id) : null, // 16
        item.isBD ? getBDData(item.internal_id) : null, // 17
        getAvyData(item.internal_id), // 18
      ]);
    }
  );

  if (!colors) return { notFound: true };

  const props: ItemPageProps = {
    item: item,
    lists: lists,
    similarItems: similarItems,
    colors: colors as FullItemColors,
    tradeLists: tradeLists,
    itemOpenable: itemOpenable,
    itemParent: itemParent,
    NPTrades: NPTrades,
    NPPrices: itemPrices,
    lastSeen: lastSeen,
    itemEffects: itemEffects,
    wearableData: wearableData,
    ncMallData: NCMallData,
    itemRecipes: itemRecipes,
    mmeData: mmeData,
    dyeData: dyeData,
    petpetData: petpetData,
    ncInsights: ncInsights,
    bdData: bdData,
    avyData: avyData,
    messages: await loadTranslation(context.locale ?? 'en', 'item/[id]'),
    locale: context.locale,
  };

  return {
    props,
    revalidate: 60, // In seconds
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

const generateMetaDescription = (item: ItemData) => {
  const metaDescription = truncateString(item.description, 130);

  return metaDescription;
};

function truncateString(str: string, num: number) {
  if (!str) return str;

  if (str.length <= num) {
    return str;
  }

  return str.slice(0, num) + '...';
}

ItemPage.getLayout = function getLayout(page: ReactElement, props: ItemPageProps) {
  const { item, locale } = props;

  let canonical = 'https://itemdb.com.br/item/' + item.slug;
  if (locale && locale !== 'en') canonical = `https://itemdb.com.br/${locale}/item/${item.slug}`;

  return (
    <Layout
      SEO={{
        title: item.name,
        themeColor: item.color.hex,
        description: generateMetaDescription(item),
        openGraph: { images: [{ url: item.image, width: 80, height: 80, alt: item.name }] },
        canonical: canonical,
      }}
      mainColor={item.color.hex + '66'}
    >
      {page}
    </Layout>
  );
};

const isPetDayCapsule = (name: string) => /Day Y\d+ Mini Mystery Capsule/i.test(name);
