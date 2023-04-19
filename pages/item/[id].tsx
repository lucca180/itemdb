import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Image from 'next/image';
import {
  FullItemColors,
  ItemData,
  ItemLastSeen,
  ItemTag,
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
import ItemTags from '../../components/Items/ItemTags';
import { FiSend, FiEdit3 } from 'react-icons/fi';
import EditItemModal from '../../components/Modal/EditItemModal';
import FeedbackModal from '../../components/Modal/FeedbackModal';
import AddToListSelect from '../../components/UserLists/AddToListSelect';
import { GetStaticPropsContext } from 'next';
import { getItem, getSomeItemIDs } from '../api/v1/items/[id_name]';
import { getItemColor } from '../api/v1/items/colors';
import ItemOfficialLists from '../../components/Items/ItemOfficialList';
import { getItemLists } from '../api/v1/items/[id_name]/lists';
import ItemMatch from '../../components/Price/ItemMatch';
import Link from 'next/link';
import ItemComments from '../../components/Items/ItemComments';
import { getSimilarItems } from '../api/v1/items/[id_name]/similar';
import SimilarItemsCard from '../../components/Items/SimilarItemsCard';

const defaultLastSeen: ItemLastSeen = {
  sw: null,
  tp: null,
  auction: null,
  restock: null,
};

type Props = {
  item: ItemData;
  colors: FullItemColors;
  similarItems: ItemData[];
  lists?: UserList[];
};

const ItemPage = (props: Props) => {
  const { item, colors, lists } = props;
  const [prices, setPrices] = useState<PriceData[] | null>(null);
  const [seenStats, setSeen] = useState<ItemLastSeen>(defaultLastSeen);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [tags, setTags] = useState<ItemTag[]>([]);
  const [isLoading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', { fallback: true });
  const color = item?.color.rgb ?? [255, 255, 255];
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) init();
  }, [router]);

  const init = async () => {
    const id = router.query.id;
    setLoading(true);

    if (!id) return;

    const [resPrice, resStats, resTrades, resTags] = await Promise.all([
      axios.get(`/api/v1/items/${item.internal_id}/prices`),
      axios.get(`/api/v1/prices/stats/`, {
        params: {
          item_id: item.item_id ?? -1,
          name: item.name,
          image_id: item.image_id,
        },
      }),
      axios.get(`/api/v1/trades/`, {
        params: {
          name: item.name,
          image_id: item.image_id,
        },
      }),
      axios.get(`/api/v1/items/${id}/tags`),
    ]);

    setPrices(resPrice.data ?? []);
    setSeen(resStats.data);
    setTrades(resTrades.data);
    setTags(resTags.data);
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
      {item && (
        <EditItemModal
          isOpen={isEditModalOpen}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          tags={tags}
        />
      )}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
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
            <Text fontSize={{ base: 'sm', md: 'inherit' }}>{item.description}</Text>
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
          {isLargerThanMD && (
            <>
              <AddToListSelect item={item} />
              <FindAtCard item={item} />
            </>
          )}
          <ItemInfoCard item={item} />
          {colors && <ColorInfoCard colors={colors} />}
          <ItemTags toggleModal={() => setIsEditModalOpen(true)} item={item} tags={tags} />
          <Flex justifyContent="center" gap={3}>
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
            {item.isMissingInfo && <MissingInfoCard />}
            {!isLargerThanMD && (
              <>
                <AddToListSelect item={item} />
                <FindAtCard item={item} />
              </>
            )}
            {!item.isNC && (
              <ItemPriceCard
                item={item}
                lastSeen={seenStats}
                prices={prices ?? []}
                isLoading={isLoading}
              />
            )}
            {item.isNC && <ItemMatch item={item} lists={lists} />}
            {lists && <ItemOfficialLists item={item} lists={lists} />}
            {item.comment && <ItemComments item={item} />}
            <SimilarItemsCard item={item} similarItems={props.similarItems} />
          </Flex>
          <Flex w={{ base: '100%', md: '300px' }} flexFlow="column" gap={6}>
            {item.isWearable && <ItemPreview item={item} />}
            {!item.isNC && <TradeCard item={item} trades={trades} isLoading={isLoading} />}
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

  const item = await getItem(Number(id));
  if (!item) return { notFound: true };

  const [colors, lists, similarItems] = await Promise.all([
    getItemColor([item.image_id]),
    getItemLists(item.internal_id, !item.isNC),
    getSimilarItems(item.internal_id.toString()),
  ]);

  if (!colors) return { notFound: true };

  return {
    props: {
      item: item,
      lists: lists,
      similarItems: similarItems,
      colors: colors[item.image_id],
    },
    revalidate: 60, // In seconds
  };
}

export async function getStaticPaths() {
  const items = await getSomeItemIDs();

  const paths = items.map((item) => ({
    params: { id: item.internal_id.toString() },
  }));

  return { paths, fallback: 'blocking' };
}

const generateMetaDescription = (item: ItemData) => {
  const intl = new Intl.NumberFormat();

  let metaDescription = truncateString(item.description, 130);

  if (item.price.value) metaDescription += ` | Market Price: ${intl.format(item.price.value)} NP`;
  if (!item.isMissingInfo)
    metaDescription += ` - Rarity: r${item.rarity} - Category: ${item.category}`;

  metaDescription += ` | Find out more about this item on itemdb.`;

  return metaDescription;
};

function truncateString(str: string, num: number) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}
