import { Button, Divider, Flex, HStack, Link, Text, Image } from '@chakra-ui/react';
import Color from 'color';
import { GetStaticPropsContext } from 'next';
import { CreateDynamicListButton } from '../../../components/DynamicLists/CreateButton';
import Layout from '../../../components/Layout';
import { ItemData, SearchFilters, ShopInfo } from '../../../types';
import {
  getRestockProfit,
  restockBlackMarketItems,
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
import { createTranslator, useTranslations } from 'next-intl';
import { RarityView } from '../../../components/Hubs/Restock/RarityView';
import { VirtualizedItemList } from '../../../components/Utils/VirtualizedItemList';
import { useAuth } from '../../../utils/auth';
import RestockHeader from '../../../components/Hubs/Restock/RestockHeader';
import { NextPageWithLayout } from '../../_app';
import { doSearch } from '../../api/v1/search';

type RestockShopPageProps = {
  shopInfo: ShopInfo;
  messages: any;
  locale: string;
  initialItems?: ItemData[];
};

const sortTypes = {
  name: 'General.name',
  price: 'General.price',
  profit: 'General.profit',
  rarity: 'General.rarity',
  color: 'General.color',
  item_id: 'General.restock-order',
};

const RESTOCK_FILTER = (shopInfo: ShopInfo): SearchFilters => ({
  ...defaultFilters,
  restockProfit: '1',
  category: [shopIDToCategory[shopInfo.id]],
  rarity: ['1', '99'],
  limit: 3000,
  sortBy: 'price',
  sortDir: 'desc',
  status: ['active'],
  restockIncludeUnpriced: true,
});

type ItemFilter = {
  query?: string;
  minProfit: number;
};

const RestockShop: NextPageWithLayout<RestockShopPageProps> = (props: RestockShopPageProps) => {
  const t = useTranslations();
  const { shopInfo } = props;
  const { userPref, updatePref } = useAuth();
  const [filteredItems, setFilteredItems] = useState<ItemData[]>(props.initialItems ?? []);
  const [itemList, setItemList] = useState<ItemData[]>(props.initialItems ?? []);
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [itemFilter, setItemFilter] = useState<ItemFilter>({ query: undefined, minProfit: 5000 });
  const [viewType, setViewType] = useState<'default' | 'rarity'>(
    userPref?.restock_prefView ?? 'rarity'
  );

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
            : true) && (profit ? profit >= itemFilter.minProfit : true)
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
        <Text
          as="h2"
          sx={{ a: { color: Color(shopInfo.color).lightness(70).hex() } }}
          textAlign={'center'}
        >
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
          <br />
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
                {filteredItems?.length ?? itemList?.length ?? 0} {t('General.items')}
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
          <CollapseNumber disabled={loading} onChange={(val) => handleProfitChange(val ?? 5000)} />
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
        <br />
        {t('Restock.info-up-to-date-warning')}
        <br />
        <Link href="/contribute" color="gray.400">
          {t('General.learnHelp')}
        </Link>
      </Text>
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

  const filters = RESTOCK_FILTER(shopInfo);

  const result = await doSearch('', filters, false);

  const resultItems = result.content
    .filter((item) => {
      const profit = getRestockProfit(item);
      return profit ? profit >= 5000 : true;
    })
    .sort((a, b) => sortItems(a, b, 'price', 'desc'))
    .splice(0, 32);

  const props: RestockShopPageProps = {
    shopInfo: shopInfo,
    initialItems: resultItems,
    messages: (await import(`../../../translation/${context.locale}.json`)).default,
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
