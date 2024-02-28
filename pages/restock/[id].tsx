import {
  Badge,
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Spinner,
  Tag,
  Text,
  useDimensions,
} from '@chakra-ui/react';
import Color from 'color';
import { GetStaticPropsContext } from 'next';
import { CreateDynamicListButton } from '../../components/DynamicLists/CreateButton';
import Layout from '../../components/Layout';
import { ItemData, ShopInfo } from '../../types';
import {
  faerielandShops,
  getRestockProfit,
  halloweenShops,
  restockShopInfo,
  shopIDToCategory,
  slugify,
  tyrannianShops,
} from '../../utils/utils';
import { defaultFilters } from '../../utils/parseFilters';
import ItemCard from '../../components/Items/ItemCard';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SortSelect } from '../../components/Input/SortSelect';
import { SearchList } from '../../components/Search/SearchLists';
import { ViewportList } from 'react-viewport-list';
import { CollapseNumber } from '../../components/Input/CollapseNumber';
import axios from 'axios';
import { getFiltersDiff } from '../search';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

type RestockShopPageProps = {
  shopInfo: ShopInfo;
  messages: any;
};

const sortTypes = {
  name: 'General.name',
  price: 'General.price',
  profit: 'General.profit',
  rarity: 'General.rarity',
  color: 'General.color',
  item_id: 'General.restock-order',
};

type ItemFilter = {
  query?: string;
  minProfit: number;
};

const RestockShop = (props: RestockShopPageProps) => {
  const t = useTranslations();
  const { shopInfo } = props;
  const [filteredItems, setFilteredItems] = useState<ItemData[]>();
  const [itemList, setItemList] = useState<ItemData[]>();
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [itemFilter, setItemFilter] = useState<ItemFilter>({ query: undefined, minProfit: 5000 });
  const [specialDay, setSpecialDay] = useState('');

  const elementRef = useRef(null);
  const dimensions = useDimensions(elementRef, true);

  const color = Color(shopInfo.color).rgb().round().array();

  useEffect(() => {
    init();
  }, [shopInfo.id]);

  useEffect(() => {
    handleFilterChange();
  }, [itemFilter, itemList]);

  useEffect(() => {
    const shopCategory = shopIDToCategory[shopInfo.id];
    const todayNST = new Date();

    if (todayNST.getDate() === 3) setSpecialDay('hpd');
    else if (
      todayNST.getMonth() === 4 &&
      todayNST.getDate() === 12 &&
      tyrannianShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      setSpecialDay('tyrannia');

    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20 && shopCategory === 'usuki doll')
      setSpecialDay('usukicon');

    if (
      todayNST.getMonth() === 8 &&
      todayNST.getDate() === 20 &&
      faerielandShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      setSpecialDay('festival');

    if (
      todayNST.getMonth() === 9 &&
      todayNST.getDate() === 31 &&
      halloweenShops.map((x) => x.toLowerCase()).includes(shopCategory)
    )
      setSpecialDay('halloween');
  }, []);

  const init = async () => {
    setLoading(true);
    const filters = {
      ...defaultFilters,
      restockProfit: '1',
      category: [shopIDToCategory[shopInfo.id]],
      rarity: [1, 99],
      limit: 3000,
      sortBy: 'price',
      sortDir: 'desc',
    };

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
            : true) && (profit ? profit >= itemFilter.minProfit : false)
        );
      })
      .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));
    setFilteredItems(filtered);
  };

  const groupedItems = useMemo(
    () =>
      (filteredItems ?? []).reduce((acc, cur, i) => {
        const itemSize = dimensions && dimensions.borderBox.width >= 768 ? 160 : 110;
        const groupSize = dimensions ? Math.floor(dimensions.borderBox.width / itemSize) : 8;

        const groupIndex = Math.floor(i / groupSize);
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as ItemData[][]),
    [filteredItems, dimensions?.borderBox.width]
  );

  return (
    <Layout
      SEO={{
        title: `${shopInfo.name} | ${t('Restock.neopets-restock-helper')}`,
        description: t('Restock.shop-desc', {
          0: shopInfo.name + (!shopInfo.name.includes('shop') ? 'Shop' : ''),
        }),
        themeColor: shopInfo.color,
      }}
    >
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.5) 70%)`}
        zIndex={-1}
      />
      <Text fontSize="xs" mt={2}>
        <Link as={NextLink} href="/restock">
          ← {t('Restock.back-to-restock-hub')}
        </Link>
      </Text>
      <Center mt={2} mb={6} flexFlow="column" gap={2}>
        <HStack>
          <Link as={NextLink} href="/restock">
            <Badge>{shopInfo.category}</Badge>
          </Link>
          {shopInfo.difficulty.toLowerCase() !== 'medium' && (
            <Link as={NextLink} href="/restock">
              <Badge
                colorScheme={shopInfo.difficulty.toLowerCase() === 'beginner' ? 'green' : 'red'}
              >
                {shopInfo.difficulty}
              </Badge>
            </Link>
          )}
        </HStack>
        <Link
          href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
          isExternal
        >
          <Image
            src={`https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`}
            alt={`${shopInfo.name} thumbnail`}
            borderRadius="md"
            boxShadow={'md'}
          />
        </Link>
        <Heading as="h1">
          {shopInfo.name} {!shopInfo.name.includes('shop') ? 'Shop' : ''}
        </Heading>
        <Text as="h2" sx={{ a: { color: Color(shopInfo.color).lightness(70).hex() } }}>
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
        {specialDay === 'hpd' && <Tag colorScheme={'green'}>{t('Restock.half-price-day')}</Tag>}
        {specialDay === 'tyrannia' && (
          <Tag colorScheme={'orange'}>{t('Restock.tyrannian-victory-day')}</Tag>
        )}
        {specialDay === 'usukicon' && <Tag colorScheme={'pink'}>{t('Restock.usuki-day')}</Tag>}
        {specialDay === 'festival' && (
          <Tag colorScheme={'purple'}>{t('Restock.faerie-festival')}</Tag>
        )}
        {specialDay === 'halloween' && <Tag colorScheme={'orange'}>{t('Restock.halloween')}</Tag>}
      </Center>
      <Divider my={3} />
      {loading && (
        <Center>
          <Spinner />
        </Center>
      )}
      {!loading && (
        <>
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
                {filteredItems?.length ?? itemList?.length ?? 0} {t('General.items')}
              </Text>
            </HStack>

            <HStack
              flex="0 0 auto"
              minW={{ base: 'none', md: 400 }}
              justifyContent={['center', 'flex-end']}
              flexWrap={'wrap'}
            >
              <CollapseNumber onChange={(val) => handleProfitChange(val ?? 5000)} />
              <SearchList onChange={handleSearch} />
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
                  sortTypes={sortTypes}
                  sortBy={sortInfo.sortBy}
                  onClick={handleSort}
                  sortDir={sortInfo.sortDir}
                />
              </HStack>
            </HStack>
          </Flex>
          <Flex px={[1, 3]} flexFlow="column" gap={3}>
            <ViewportList items={groupedItems} viewportRef={null} initialPrerender={4} overscan={2}>
              {(group, index) => (
                <Flex
                  ref={elementRef}
                  gap={[1, 3]}
                  key={index}
                  justifyContent="center"
                  flexWrap={'wrap'}
                >
                  {group.map((item) => (
                    <ItemCard key={item.internal_id} item={item} disablePrefetch />
                  ))}
                </Flex>
              )}
            </ViewportList>
          </Flex>
        </>
      )}
    </Layout>
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

  const props: RestockShopPageProps = {
    shopInfo: shopInfo,
    messages: (await import(`../../translation/${context.locale}.json`)).default,
  };

  return {
    props,
    revalidate: 10, // In seconds
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
        (itemA.price.value ?? Number.MAX_SAFE_INTEGER) -
          (itemB.price.value ?? Number.MAX_SAFE_INTEGER) ||
        (itemA.owls?.valueMin ?? Number.MAX_SAFE_INTEGER) -
          (itemB.owls?.valueMin ?? Number.MAX_SAFE_INTEGER)
      );
    else
      return (
        (itemB.price.value ?? Number.MIN_SAFE_INTEGER) -
          (itemA.price.value ?? Number.MIN_SAFE_INTEGER) ||
        (itemB.owls?.valueMin ?? Number.MIN_SAFE_INTEGER) -
          (itemA.owls?.valueMin ?? Number.MIN_SAFE_INTEGER)
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
