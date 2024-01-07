import { Badge, Box, Button, Flex, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Image from 'next/image';
import {
  FullItemColors,
  ItemData,
  ItemLastSeen,
  ItemOpenable,
  // ItemTag,
  PriceData,
  TradeData,
  UserList,
} from '../../types';
import { useRouter } from 'next/router';
import FindAtCard from '../../components/Items/FindAtCard';
import ItemInfoCard from '../../components/Items/InfoCard';
import ColorInfoCard from '../../components/Items/ColorInfoCard';
import MissingInfoCard from '../../components/Items/MissingInfoCard';
import ItemPreview from '../../components/Items/ItemPreview';
import ItemPriceCard from '../../components/Price/ItemPriceCard';
import axios from 'axios';
import TradeCard from '../../components/Trades/TradeCard';
// import ItemTags from '../../components/Items/ItemTags';
import { FiSend, FiEdit3 } from 'react-icons/fi';
import { EditItemModalProps } from '../../components/Modal/EditItemModal';
import { FeedbackModalProps } from '../../components/Modal/FeedbackModal';
import AddToListSelect from '../../components/UserLists/AddToListSelect';
import { GetStaticPropsContext } from 'next';
import { getItem, getSomeItemIDs } from '../api/v1/items/[id_name]';
import { getItemColor } from '../api/v1/items/colors';
import ItemOfficialLists from '../../components/Items/ItemOfficialList';
import { getItemLists } from '../api/v1/items/[id_name]/lists';
import NCTrade from '../../components/NCTrades';
import Link from 'next/link';
import ItemComments from '../../components/Items/ItemComments';
import { getSimilarItems } from '../api/v1/items/[id_name]/similar';
import SimilarItemsCard from '../../components/Items/SimilarItemsCard';
import { getItemDrops, getItemParent } from '../api/v1/items/[id_name]/drops';
import ItemDrops from '../../components/Items/ItemDrops';
import ItemParent from '../../components/Items/ItemParent';
import dynamic from 'next/dynamic';
import { getItemPrices } from '../api/v1/items/[id_name]/prices';
import { getItemTrades } from '../api/v1/trades';
import ItemRestock from '../../components/Items/ItemRestockInfo';
import { getLastSeen } from '../api/v1/prices/stats';
import ManualCheckCard from '../../components/Items/ManualCheckCard';
import ItemMyLists from '../../components/Items/MyListsCard';

const EditItemModal = dynamic<EditItemModalProps>(
  () => import('../../components/Modal/EditItemModal')
);
const FeedbackModal = dynamic<FeedbackModalProps>(
  () => import('../../components/Modal/FeedbackModal')
);

type ItemPageProps = {
  item: ItemData;
  colors: FullItemColors;
  similarItems: ItemData[];
  lists?: UserList[];
  tradeLists?: UserList[];
  itemOpenable: ItemOpenable | null;
  itemParent: number[];
  lastSeen: ItemLastSeen;
  NPTrades: TradeData[];
  NPPrices: PriceData[];
};

const ItemPage = (props: ItemPageProps) => {
  const {
    item,
    colors,
    lists,
    tradeLists,
    itemOpenable,
    itemParent,
    NPPrices,
    NPTrades: trades,
    lastSeen: seenProps,
  } = props;
  const [prices, setPrices] = useState<PriceData[] | null>(NPPrices);
  const [seenStats, setSeen] = useState<ItemLastSeen | null>(seenProps);
  // const [trades, setTrades] = useState<TradeData[]>([]);
  // const [tags, setTags] = useState<ItemTag[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const color = item?.color.rgb ?? [255, 255, 255];
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) init();
  }, [router, router.pathname]);

  useEffect(() => {
    setPrices(NPPrices);
  }, [NPPrices]);

  const init = async () => {
    setLoading(true);

    if (item.isNC || item.status === 'no trade') {
      // const [resTags] = await Promise.all([axios.get(`/api/v1/items/${item.internal_id}/tags`)]);

      // setTags(resTags.data);
      setLoading(false);
      return;
    }

    const [resPrice, resStats] = await Promise.all([
      axios.get(`/api/v1/items/${item.internal_id}/prices`),
      axios.get(`/api/v1/prices/stats/`, {
        params: {
          item_id: item.item_id ?? -1,
          name: item.name,
          image_id: item.image_id,
        },
      }),
      // axios.get(`/api/v1/trades/`, {
      //   params: {
      //     name: item.name,
      //     image_id: item.image_id,
      //   },
      // }),
      // axios.get(`/api/v1/items/${item.internal_id}/tags`),
    ]);

    setPrices(resPrice.data ?? []);
    setSeen(resStats.data);
    // setTrades(resTrades.data);
    // setTags(resTags.data);
    setLoading(false);
  };

  return (
    <Layout
      SEO={{
        title: item.name,
        themeColor: item.color.hex,
        description: generateMetaDescription(item),
        openGraph: { images: [{ url: item.image, width: 80, height: 80, alt: item.name }] },
      }}
    >
      {item && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          itemOpenable={itemOpenable}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          tags={[]}
        />
      )}
      {feedbackModalOpen && (
        <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
      )}
      <Box>
        <Box
          position="absolute"
          h="40vh"
          left="0"
          width="100%"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.4) 80%)`}
          zIndex={-1}
        />
        <Flex gap={{ base: 4, md: 8 }} pt={6} alignItems="center">
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
                  borderRadius="md"
                  href={`/search?s=&category[]=${item.category ?? 'Unknown'}`}
                >
                  {item.category ?? '???'}
                </Badge>
              }
              {item.type === 'np' && (
                <Badge colorScheme="green" borderRadius="md" as={Link} href="/search?s=&type[]=np">
                  NP
                </Badge>
              )}
              {item.type === 'nc' && (
                <Badge colorScheme="purple" borderRadius="md" as={Link} href="/search?s=&type[]=nc">
                  NC
                </Badge>
              )}
              {item.type === 'pb' && (
                <Badge colorScheme="yellow" borderRadius="md" as={Link} href="/search?s=&type[]=pb">
                  PB
                </Badge>
              )}
              {item.isWearable && (
                <Badge
                  colorScheme="blue"
                  borderRadius="md"
                  as={Link}
                  href="/search?s=&type[]=wearable"
                >
                  Wearable
                </Badge>
              )}
              {item.isNeohome && (
                <Badge
                  colorScheme="cyan"
                  borderRadius="md"
                  as={Link}
                  href="/search?s=&type[]=neohome"
                >
                  Neohome
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
        flexFlow={{ base: 'column-reverse', md: 'row' }}
        alignItems={{ base: 'center', md: 'inherit' }}
      >
        <Flex
          flex="1"
          maxW={{ base: '100vh', md: '275px' }}
          w={{ base: '100%', md: 'auto' }}
          minW="200px"
          flexFlow="column"
          gap={5}
        >
          <Flex flexFlow="column" display={{ base: 'none', md: 'flex' }} gap={5}>
            <AddToListSelect item={item} />
            <FindAtCard item={item} />
          </Flex>

          <ItemInfoCard item={item} />
          {colors && <ColorInfoCard colors={colors} />}
          {/* <ItemTags toggleModal={() => setIsEditModalOpen(true)} item={item} tags={tags} /> */}
          <Flex justifyContent="center" gap={1}>
            <Button variant="outline" size="sm" onClick={() => setFeedbackModalOpen(true)}>
              <Icon as={FiSend} mr={1} /> Feedback
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Icon as={FiEdit3} mr={1} /> Edit
            </Button>
          </Flex>
        </Flex>
        <Flex
          flex="3"
          gap={{ base: 4, md: 6 }}
          flexFlow={{ base: 'column', lg: 'row' }}
          maxW={{ base: '100vh', md: 'none' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Flex flex="2" flexFlow="column" gap={{ base: 4, md: 6 }}>
            <ManualCheckCard item={item} />
            {item.isMissingInfo && <MissingInfoCard />}

            <Flex flexFlow="column" gap={{ base: 4, md: 6 }} display={{ base: 'flex', md: 'none' }}>
              <AddToListSelect item={item} />
              <FindAtCard item={item} />
            </Flex>

            {!item.isNC && <ItemPriceCard item={item} lastSeen={seenStats} prices={prices ?? []} />}
            {item.isNC && <NCTrade item={item} lists={tradeLists} />}
            {lists && <ItemOfficialLists item={item} lists={lists} />}
            <ItemMyLists item={item} />
            {item.comment && <ItemComments item={item} />}
            {itemOpenable && <ItemDrops item={item} itemOpenable={itemOpenable} />}
            <SimilarItemsCard item={item} similarItems={props.similarItems} />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            {item.isWearable && <ItemPreview item={item} isLoading={isLoading} />}
            {item.findAt.restockShop && <ItemRestock item={item} lastSeen={seenStats} />}
            {!item.isNC && item.status === 'active' && <TradeCard item={item} trades={trades} />}
            {itemParent.length > 0 && <ItemParent item={item} parentItems={itemParent} />}
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default ItemPage;

export async function getStaticProps(context: GetStaticPropsContext) {
  const id = context.params?.id as string | undefined;
  if (!id) return { notFound: true };
  let item;

  const isIdNumber = !isNaN(Number(id));

  if (isIdNumber) {
    item = await getItem(Number(id));
    if (!item) return { notFound: true };

    if (item.slug)
      return {
        redirect: {
          destination: `/item/${item.slug}`,
          permanent: true,
        },
      };
  } else item = await getItem(id);

  if (!item) return { notFound: true };

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
  ] = await Promise.all([
    getItemColor([item.image_id]),
    getItemLists(item.internal_id, true, false),
    getSimilarItems(item.internal_id.toString()),
    item.isNC ? getItemLists(item.internal_id, false, false) : [],
    getItemDrops(item.internal_id, item.isNC),
    getItemParent(item.internal_id),
    getItemPrices({ iid: item.internal_id }),
    getItemTrades({ name: item.name, image_id: item.image_id }),
    getLastSeen({ item_id: item.item_id, name: item.name, image_id: item.image_id }),
  ]);

  if (!colors) return { notFound: true };

  const props: ItemPageProps = {
    item: item,
    lists: lists,
    similarItems: similarItems,
    colors: colors[item.image_id] as FullItemColors,
    tradeLists: tradeLists,
    itemOpenable: itemOpenable,
    itemParent: itemParent,
    NPTrades: NPTrades,
    NPPrices: itemPrices,
    lastSeen: lastSeen,
  };

  return {
    props,
    revalidate: 10, // In seconds
  };
}

export async function getStaticPaths() {
  const items = await getSomeItemIDs();

  const paths = items.map((item) => ({
    params: { id: item.slug ?? item.internal_id.toString() },
  }));

  return { paths, fallback: 'blocking' };
}

const generateMetaDescription = (item: ItemData) => {
  // const intl = new Intl.NumberFormat();

  const metaDescription = truncateString(item.description, 130);

  // if (hasDrops) metaDescription += ` | Check out drop rates`;

  // if (item.price.value) metaDescription += ` | Market Price: ${intl.format(item.price.value)} NP`;

  // if (!item.isMissingInfo)
  //   metaDescription += ` - Rarity: r${item.rarity} - Category: ${item.category}`;

  // metaDescription += ` | Find out more about this item on itemdb.`;

  return metaDescription;
};

function truncateString(str: string, num: number) {
  if (!str) return str;

  if (str.length <= num) {
    return str;
  }

  return str.slice(0, num) + '...';
}
