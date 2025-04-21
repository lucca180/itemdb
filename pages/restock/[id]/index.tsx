import { Button, Divider, Flex, HStack, Link, Text, Image, Heading } from '@chakra-ui/react';
import Color from 'color';
import { GetStaticPropsContext } from 'next';
import { CreateDynamicListButton } from '../../../components/DynamicLists/CreateButton';
import Layout from '../../../components/Layout';
import { ItemData, SearchFilters, ShopInfo } from '../../../types';
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
import { CollapseNumber } from '../../../components/Input/CollapseNumber';
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

const RESTOCK_FILTER = (shopInfo: ShopInfo): SearchFilters => ({
  ...defaultFilters,
  restockProfit: '1',
  category: [shopIDToCategory[shopInfo.id]],
  rarity: ['1', '99'],
  limit: 10000,
  sortBy: 'price',
  sortDir: 'desc',
  status: ['active'],
  restockIncludeUnpriced: true,
});

type ItemFilter = {
  query?: string;
  minProfit: number;
};

const INITIAL_MIN_PROFIT = 3000;

const RestockShop: NextPageWithLayout<RestockShopPageProps> = (props: RestockShopPageProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { shopInfo, totalItems, profitableCount, similarShops } = props;
  const { userPref, updatePref } = useAuth();
  const [filteredItems, setFilteredItems] = useState<ItemData[]>(props.initialItems ?? []);
  const [itemList, setItemList] = useState<ItemData[]>(props.initialItems ?? []);
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [itemFilter, setItemFilter] = useState<ItemFilter>({
    query: undefined,
    minProfit: INITIAL_MIN_PROFIT,
  });
  const [viewType, setViewType] = useState<'default' | 'rarity'>(
    userPref?.restock_prefView ?? 'rarity'
  );

  const shopColor = Color(shopInfo.color);

  useEffect(() => {
    init();
  }, [shopInfo.id]);

  useEffect(() => {
    if (props.initialItems?.length === itemList.length) return;
    handleFilterChange();
  }, [itemFilter, itemList]);

  const init = async () => {
    setLoading(true);
    const filters = RESTOCK_FILTER(shopInfo);

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

    setItemFilter({ ...itemFilter, query: query });
  };

  const handleProfitChange = (value: number) => {
    setItemFilter({ ...itemFilter, minProfit: value });
  };

  const handleFilterChange = () => {
    if (!itemList) return;

    const filtered = [...itemList]
      .filter((item) => {
        const profit = getRestockProfit(item);
        return (
          (itemFilter.query
            ? item.name.toLowerCase().includes(itemFilter.query.toLowerCase())
            : true) && (profit !== null ? profit >= itemFilter.minProfit : true)
        );
      })
      .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));

    setFilteredItems(filtered);
  };

  const toggleView = () => {
    const newView = viewType === 'default' ? 'rarity' : 'default';
    setViewType(newView);
    updatePref('restock_prefView', newView);
  };

  return (
    <>
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
            query={itemFilter.query || undefined}
            filters={{
              ...defaultFilters,
              restockProfit: itemFilter.minProfit.toString(),
              category: [shopIDToCategory[shopInfo.id]],
              rarity: ['1', '99'],
              limit: 3000,
              sortBy: 'price',
              sortDir: 'desc',
            }}
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
          <CollapseNumber disabled={loading} onChange={(val) => handleProfitChange(val ?? 3000)} />
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
              sortDir={sortInfo.sortDir}
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

  const filters: SearchFilters = { ...RESTOCK_FILTER(shopInfo), restockProfit: '' };

  const result = await doSearch('', filters, false);

  const resultItems = result.content
    .filter((item) => {
      const profit = getRestockProfit(item);
      return profit !== null ? profit >= INITIAL_MIN_PROFIT : true;
    })
    .sort((a, b) => sortItems(a, b, 'price', 'desc'));

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
  const paths = Object.values(restockShopInfo)
    .splice(0, 5)
    .map((shop) => ({
      params: { id: slugify(shop.name) },
    }));

  return { paths, fallback: 'blocking' };
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
      return (itemA.rarity ?? Number.MAX_SAFE_INTEGER) - (itemB.rarity ?? Number.MAX_SAFE_INTEGER);
    }

    return (itemB.rarity ?? Number.MIN_SAFE_INTEGER) - (itemA.rarity ?? Number.MIN_SAFE_INTEGER);
  } else if (sortBy === 'price') {
    if (sortDir === 'asc')
      return (
        (itemA.price.value ?? Number.MIN_SAFE_INTEGER) -
          (itemB.price.value ?? Number.MIN_SAFE_INTEGER) ||
        (itemA.owls?.valueMin ?? Number.MIN_SAFE_INTEGER) -
          (itemB.owls?.valueMin ?? Number.MIN_SAFE_INTEGER)
      );
    else
      return (
        (itemB.price.value ?? Number.MAX_SAFE_INTEGER) -
          (itemA.price.value ?? Number.MAX_SAFE_INTEGER) ||
        (itemB.owls?.valueMin ?? Number.MAX_SAFE_INTEGER) -
          (itemA.owls?.valueMin ?? Number.MAX_SAFE_INTEGER)
      );
  } else if (sortBy === 'item_id') {
    if (sortDir === 'asc')
      return (
        (itemA.item_id ?? Number.MAX_SAFE_INTEGER) - (itemB.item_id ?? Number.MAX_SAFE_INTEGER)
      );

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
      return (
        (getRestockProfit(itemA) ?? Number.MAX_SAFE_INTEGER) -
        (getRestockProfit(itemB) ?? Number.MAX_SAFE_INTEGER)
      );
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
        title: `${shopInfo.name} | ${t('Restock.neopets-restock-helper')}`,
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
