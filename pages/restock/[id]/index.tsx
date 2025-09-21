import {
  Button,
  Divider,
  Flex,
  HStack,
  Link,
  Text,
  Image,
  Heading,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import Color from 'color';
import { GetStaticPropsContext } from 'next';
import { CreateDynamicListButton } from '../../../components/DynamicLists/CreateButton';
import Layout from '../../../components/Layout';
import { ItemData, SearchFilters, SearchResults, SearchStats, ShopInfo } from '../../../types';
import {
  getRestockProfit,
  removeOutliers,
  restockBlackMarketItems,
  // restockChance,
  restockShopInfo,
  shopIDToCategory,
  slugify,
} from '../../../utils/utils';
import { defaultFilters } from '../../../utils/parseFilters';
import { ReactElement, useEffect, useState } from 'react';
import { SortSelect } from '../../../components/Input/SortSelect';
import { SearchList } from '../../../components/Search/SearchLists';
import axios from 'axios';
import { getFiltersDiff } from '../../search';
import { createTranslator, useFormatter, useTranslations } from 'next-intl';
import { RarityView } from '../../../components/Hubs/Restock/RarityView';
import { VirtualizedItemList } from '../../../components/Utils/VirtualizedItemList';
import { useAuth } from '../../../utils/auth';
import RestockHeader from '../../../components/Hubs/Restock/RestockHeader';
import { NextPageWithLayout } from '../../_app';
import { doSearch } from '../../api/v1/search';
import { ShopInfoCard } from '../../../components/Hubs/Restock/ShopInfoCard';
import { mean } from 'simple-statistics';
import ShopCard from '../../../components/Hubs/Restock/ShopCard';
import { loadTranslation } from '@utils/load-translation';
import { BsFilter } from 'react-icons/bs';
import dynamic from 'next/dynamic';

const SearchFilterModal = dynamic(() => import('../../../components/Search/SearchFiltersModal'));

type RestockShopPageProps = {
  shopInfo: ShopInfo;
  totalItems: number;
  profitableCount: number;
  profitMean: number;
  // rarityChances: { [rarity: number]: number };
  messages: any;
  locale: string;
  initialItems?: ItemData[];
  similarShops: ShopInfo[];
};

const sortTypes = {
  name: 'name',
  price: 'price',
  profit: 'profit',
  rarity: 'rarity',
  color: 'color',
  item_id: 'restock-order',
};

const INITIAL_MIN_PROFIT = '3000';

const RESTOCK_FILTER = (shopInfo: ShopInfo): SearchFilters => ({
  ...defaultFilters,
  restockProfit: INITIAL_MIN_PROFIT,
  category: [shopIDToCategory[shopInfo.id]],
  rarity: ['1', '99'],
  limit: 10000,
  sortBy: 'price',
  sortDir: 'desc',
  status: ['active'],
  restockIncludeUnpriced: true,
});

const RestockShop: NextPageWithLayout<RestockShopPageProps> = (props: RestockShopPageProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { shopInfo, totalItems, profitableCount, similarShops } = props;
  const { userPref, updatePref } = useAuth();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [filteredItems, setFilteredItems] = useState<ItemData[]>(props.initialItems ?? []);
  const [itemList, setItemList] = useState<ItemData[]>(props.initialItems ?? []);
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>(RESTOCK_FILTER(shopInfo));
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isFiltered, setFiltered] = useState(false);

  const [viewType, setViewType] = useState<'default' | 'rarity'>(
    userPref?.restock_prefView ?? 'rarity'
  );

  const shopColor = Color(shopInfo.color);

  useEffect(() => {
    resetFilters(true);
  }, [shopInfo.id]);

  useEffect(() => {
    if (props.initialItems?.length === itemList.length) return;
    handleFilterChange();
  }, [itemSearch, itemList]);

  const init = async (forceStats = false) => {
    setLoading(true);
    const filters = RESTOCK_FILTER(shopInfo);

    if (!stats || forceStats) {
      axios
        .get('/api/v1/search/stats', {
          params: {
            forceCategory: shopIDToCategory[shopInfo.id],
            isRestock: 'true',
          },
        })
        .then((res) => {
          setStats(res.data);
        });
    }

    const res = await axios.get('/api/v1/search', {
      params: {
        ...getFiltersDiff(filters),
        skipStats: true,
      },
    });

    const searchResult = res.data;

    setItemList(searchResult.content);
    setLoading(false);
  };

  const handleSort = (sortBy: string, sortDir: string) => {
    if (!filteredItems) return;
    setSortInfo({ sortBy: sortBy, sortDir: sortDir });
    setFilteredItems([...filteredItems].sort((a, b) => sortItems(a, b, sortBy, sortDir)));
  };

  const handleSearch = (query: string) => {
    if (!itemList) return;

    setItemSearch(query);
  };

  const handleFilterChange = () => {
    if (!itemList) return;

    const filtered = [...itemList]
      .filter((item) => {
        return itemSearch ? item.name.toLowerCase().includes(itemSearch.toLowerCase()) : true;
      })
      .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));

    setFilteredItems(filtered);
  };

  const toggleView = () => {
    const newView = viewType === 'default' ? 'rarity' : 'default';
    setViewType(newView);
    updatePref('restock_prefView', newView);
  };

  const applyFilters = async (newFilters: SearchFilters) => {
    setLoading(true);
    const res = await axios.get('/api/v1/search', {
      params: {
        ...getFiltersDiff(newFilters),
        skipStats: true,
      },
    });

    const data = res.data as SearchResults;

    const searchResult = data.content
      .filter((item) => {
        return itemSearch ? item.name.toLowerCase().includes(itemSearch.toLowerCase()) : true;
      })
      .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));

    setFilteredItems(searchResult);
    setItemList(data.content);
    setFiltered(true);
    setLoading(false);
    onClose();
  };

  const resetFilters = (force = false) => {
    setFilters(RESTOCK_FILTER(shopInfo));
    setItemSearch('');
    init(force);
    setFiltered(false);
  };

  return (
    <>
      {isOpen && (
        <SearchFilterModal
          isLists
          isOpen={isOpen}
          onClose={onClose}
          filters={filters}
          stats={stats}
          onChange={(filters) => setFilters(filters)}
          resetFilters={resetFilters}
          applyFilters={applyFilters}
        />
      )}
      <RestockHeader shop={shopInfo}>
        <Text as="h2" sx={{ a: { color: shopColor.lightness(70).hex() } }} textAlign={'center'}>
          {t.rich('Restock.profitable-items-from', {
            Link: (chunk) => (
              <Link
                href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
                isExternal
              >
                {chunk}
                <Image
                  src={'/icons/neopets.png'}
                  width={'16px'}
                  height={'16px'}
                  style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                  alt="link icon"
                />
              </Link>
            ),
            shopname: shopInfo.name,
          })}
        </Text>
        <Text as="h3">
          <Link
            href={`/search?s=&category[]=${shopIDToCategory[shopInfo.id]}&rarity[]=1&rarity[]=99`}
          >
            {t('Restock.view-all-items-from-this-shop')}
            <Image
              src={'/favicon.svg'}
              width={'18px'}
              height={'18px'}
              style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
              alt="link icon"
            />
          </Link>
        </Text>
        <HStack alignItems={'stretch'} justifyContent={'center'} flexWrap={'wrap'} mt={3}>
          <ShopInfoCard>
            <Text fontSize={'xs'}>
              {t.rich('Restock.shop-info-category', {
                b: (chunk) => <b>{chunk}</b>,
                rawCat: shopInfo.category,
                name: shopInfo.name,
                category: shopIDToCategory[shopInfo.id],
                Link: (chunk) => (
                  <Link
                    href={`/search?s=&category[]=${shopIDToCategory[shopInfo.id]}`}
                    textTransform={'capitalize'}
                  >
                    {chunk}
                  </Link>
                ),
              })}
            </Text>
          </ShopInfoCard>
          <ShopInfoCard>
            <Text fontSize={'xs'}>
              {t.rich('Restock.ats-total-items', {
                b: (chunk) => <b>{chunk}</b>,
                totalItems: format.number(totalItems),
                profitableCount: format.number(profitableCount),
              })}
            </Text>
          </ShopInfoCard>
          {/* <ShopInfoCard>
            <Text fontSize={'xs'}>
              {t.rich('Restock.ats-r99-chances', {
                b: (chunk) => <b>{chunk}</b>,
                x: rarityChances[99].toFixed(2),
              })}
            </Text>
          </ShopInfoCard> */}
          <ShopInfoCard>
            <Text fontSize={'xs'}>
              {t.rich('Restock.ats-avg-profit', {
                b: (chunk) => <b>{chunk}</b>,
                x: format.number(props.profitMean),
              })}
            </Text>
          </ShopInfoCard>
        </HStack>
      </RestockHeader>
      <Divider my={3} />

      <Flex
        justifyContent={'space-between'}
        alignItems="center"
        gap={3}
        mb={3}
        flexFlow={{ base: 'column-reverse', lg: 'row' }}
      >
        <HStack alignItems={'center'}>
          <CreateDynamicListButton
            removeMargin
            isLoading={loading}
            resultCount={filteredItems?.length ?? itemList?.length ?? 0}
            query={itemSearch || undefined}
            filters={filters}
          />
          <Text as="div" textColor={'gray.300'} fontSize="sm">
            {!loading && (
              <>
                {filteredItems?.length ?? itemList?.length ?? 0} {t('General.items').toLowerCase()}
              </>
            )}
          </Text>
        </HStack>

        <HStack
          flex="0 0 auto"
          minW={{ base: 'none', md: 400 }}
          justifyContent={['center', 'flex-end']}
          flexWrap={'wrap'}
        >
          <Button isLoading={loading} onClick={toggleView}>
            {viewType === 'rarity' ? t('Restock.use-classic-view') : t('Restock.use-rarity-view')}
          </Button>
          <IconButton
            isLoading={loading}
            aria-label="search filters"
            onClick={onOpen}
            icon={<BsFilter />}
            colorScheme={isFiltered ? 'blue' : undefined}
          />
          <SearchList disabled={loading} onChange={handleSearch} />
          <HStack>
            <Text
              flex="0 0 auto"
              textColor={'gray.300'}
              fontSize="sm"
              display={{ base: 'none', md: 'inherit' }}
            >
              {t('General.sort-by')}
            </Text>
            <SortSelect
              disabled={loading}
              sortTypes={sortTypes}
              sortBy={sortInfo.sortBy}
              onClick={handleSort}
              sortDir={sortInfo.sortDir as 'asc' | 'desc'}
            />
          </HStack>
        </HStack>
      </Flex>
      {viewType === 'default' && (
        <VirtualizedItemList
          sortType={sortInfo.sortBy}
          items={filteredItems ?? []}
          highlightList={restockBlackMarketItems}
        />
      )}
      {viewType === 'rarity' && (
        <>
          <RarityView itemList={filteredItems} sortType={sortInfo.sortBy} />
        </>
      )}
      <Text textAlign={'center'} mt={8} fontSize="xs">
        {t.rich('Restock.bmg-warning', {
          Link: (chunk) => (
            <Link href="/lists/official/1952" color="yellow.200">
              {chunk}
            </Link>
          ),
        })}
      </Text>
      <Text textAlign={'center'} fontSize="xs">
        <br />
        {t('Restock.info-up-to-date-warning')}
        <br />
        <Link href="/contribute" color="gray.400">
          {t('General.learnHelp')}
        </Link>
      </Text>
      <Flex flexFlow="column" mt={10} gap={3} p={5} borderRadius={'lg'} bg="blackAlpha.500">
        <Heading size="lg">{t('Restock.similar-shops')}</Heading>
        <Flex gap={5} flexWrap="wrap" justifyContent={'center'}>
          {similarShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </Flex>
      </Flex>
    </>
  );
};

export default RestockShop;

export async function getStaticProps(context: GetStaticPropsContext) {
  const id = context.params?.id as string | undefined;

  if (!id) return { notFound: true };
  let shopInfo;

  if (isNaN(Number(id))) {
    shopInfo = Object.values(restockShopInfo).find((shop) => slugify(shop.name) === id);
  } else {
    shopInfo = restockShopInfo[id];
    return {
      redirect: {
        destination: `/restock/${slugify(shopInfo.name)}`,
        permanent: true,
      },
    };
  }

  if (!shopInfo) return { notFound: true };

  if (Number(shopInfo.id) < 0) return { notFound: true };

  const filters: SearchFilters = RESTOCK_FILTER(shopInfo);

  const result = await doSearch('', filters, false);

  const resultItems = result.content.sort((a, b) => sortItems(a, b, 'price', 'desc'));

  const props: RestockShopPageProps = {
    shopInfo: shopInfo,
    totalItems: result.content.length,
    profitableCount: resultItems.length,
    // rarityChances: profitableChance(result.content),
    profitMean: profitMean(resultItems),
    similarShops: getSimilarShops(shopInfo),
    initialItems: resultItems.splice(0, 32),
    messages: await loadTranslation(context.locale as string, 'restock/[id]/index'),
    locale: context.locale ?? 'en',
  };

  return {
    props,
    revalidate: 600,
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

const sortItems = (a: ItemData, b: ItemData, sortBy: string, sortDir: string) => {
  const itemA = a;
  const itemB = b;
  if (!itemA || !itemB) return 0;

  if (sortBy === 'name') {
    if (sortDir === 'asc') return itemA.name.localeCompare(itemB.name);
    else return itemB.name.localeCompare(itemA.name);
  } else if (sortBy === 'rarity') {
    if (sortDir === 'asc') {
      return (itemA.rarity ?? Infinity) - (itemB.rarity ?? Infinity);
    }

    return (itemB.rarity ?? Number.MIN_SAFE_INTEGER) - (itemA.rarity ?? Number.MIN_SAFE_INTEGER);
  } else if (sortBy === 'price') {
    if (sortDir === 'asc')
      return (
        (itemA.price.value ?? Number.MIN_SAFE_INTEGER) -
          (itemB.price.value ?? Number.MIN_SAFE_INTEGER) ||
        (itemA.ncValue?.minValue ?? Number.MIN_SAFE_INTEGER) -
          (itemB.ncValue?.minValue ?? Number.MIN_SAFE_INTEGER)
      );
    else
      return (
        (itemB.price.value ?? Infinity) - (itemA.price.value ?? Infinity) ||
        (itemB.ncValue?.minValue ?? Infinity) - (itemA.ncValue?.minValue ?? Infinity)
      );
  } else if (sortBy === 'item_id') {
    if (sortDir === 'asc') return (itemA.item_id ?? Infinity) - (itemB.item_id ?? Infinity);

    return (itemB.item_id ?? Number.MIN_SAFE_INTEGER) - (itemA.item_id ?? Number.MIN_SAFE_INTEGER);
  } else if (sortBy === 'color') {
    const colorA = new Color(itemA.color.hex);
    const colorB = new Color(itemB.color.hex);
    const hsvA = colorA.hsv().array();
    const hsvB = colorB.hsv().array();

    if (sortDir === 'asc') return hsvB[0] - hsvA[0] || hsvB[1] - hsvA[1] || hsvB[2] - hsvA[2];
    else return hsvA[0] - hsvB[0] || hsvA[1] - hsvB[1] || hsvA[2] - hsvB[2];
  } else if (sortBy === 'profit') {
    if (sortDir === 'asc')
      return (getRestockProfit(itemA) ?? Infinity) - (getRestockProfit(itemB) ?? Infinity);
    else
      return (
        (getRestockProfit(itemB) ?? Number.MIN_SAFE_INTEGER) -
        (getRestockProfit(itemA) ?? Number.MIN_SAFE_INTEGER)
      );
  }
  return 0;
};

RestockShop.getLayout = function getLayout(page: ReactElement, props: RestockShopPageProps) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  const { shopInfo } = props;
  return (
    <Layout
      SEO={{
        title: `${shopInfo.name} | Neopets Shops`,
        description: t('Restock.shop-desc', {
          0: shopInfo.name,
          category: shopInfo.category,
        }),
        themeColor: shopInfo.color,
        twitter: {
          cardType: 'summary_large_image',
        },
        openGraph: {
          images: [
            {
              url: `https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`,
              width: 450,
              height: 150,
              alt: shopInfo.name,
            },
          ],
        },
      }}
      mainColor={`${shopInfo.color}a6`}
    >
      {page}
    </Layout>
  );
};

// based on https://www.reddit.com/r/neopets/comments/16u9rx5/restocking_specifics
// const profitableChance = (items: ItemData[]) => {
//   const itemRarityMap: { [rarity: number]: number } = {};

//   items.map((item) => {
//     if (!item.rarity) return;
//     if (!itemRarityMap[item.rarity]) itemRarityMap[item.rarity] = 0;
//     itemRarityMap[item.rarity]++;
//   });

//   const rollNumber = Math.ceil(items.length * 1.6);

//   const rarityChance: { [rarity: number]: number } = {};

//   for (let i = 1; i <= 99; i++) {
//     rarityChance[i] = 0;
//     if (!itemRarityMap[i]) continue;
//     rarityChance[i] = (rollNumber / items.length) * (restockChance[i] / 100) * 100;
//   }

//   return rarityChance;
// };

const profitMean = (items: ItemData[]) => {
  const profits = items
    .map((item) => getRestockProfit(item, true))
    .filter((profit) => profit !== null);

  const cleanProfit = removeOutliers(profits, 1.75);

  if (!cleanProfit.length) return 0;

  return Math.round(mean(cleanProfit));
};

const getSimilarShops = (shopInfo: ShopInfo, limit = 3) => {
  const similar = Object.values(restockShopInfo).filter((shop) => {
    if (shop.id === shopInfo.id) return false;
    return shop.category === shopInfo.category;
  });

  return similar.slice(0, limit);
};
