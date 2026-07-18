'use client';

import { Button, Flex, HStack, IconButton, Text, useDisclosure } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BsFilter } from 'react-icons/bs';
import { CreateDynamicListButton } from '@components/DynamicLists/CreateButton';
import { RarityView } from '@components/Hubs/Restock/RarityView';
import { SortSelect } from '@components/Input/SortSelect';
import { SearchList } from '@components/Search/SearchLists';
import { VirtualizedItemList } from '@components/Utils/VirtualizedItemList';
import type { ItemV2For, SearchFilters, SearchStats, ShopInfo } from '@types';
import { getFiltersDiff } from '@utils/parseFilters';
import { useAuth } from '@utils/auth';
import { RESTOCK_FILTER } from '@utils/restock-filters';
import { getRestockProfitV2 } from '@utils/item/v2';
import { restockBlackMarketItems, shopIDToCategory } from '@utils/utils';
import Color from 'color';
import type { RestockShopClientLabels } from './buildRestockShopPageProps';

const SearchFilterModal = dynamic(() => import('@components/Search/SearchFiltersModal'), {
  ssr: false,
});

const sortTypes = {
  name: 'name',
  price: 'price',
  profit: 'profit',
  rarity: 'rarity',
  color: 'color',
  item_id: 'restock-order',
};

type RestockShopItem = ItemV2For<'card'>;

type RestockShopPageClientProps = {
  shopInfo: ShopInfo;
  initialItems: RestockShopItem[];
  labels: RestockShopClientLabels;
};

export function RestockShopPageClient({
  shopInfo,
  initialItems,
  labels,
}: RestockShopPageClientProps) {
  const { userPref, updatePref } = useAuth();
  const { open, onClose, onOpen } = useDisclosure();
  const [filteredItems, setFilteredItems] = useState<RestockShopItem[]>(initialItems);
  const [itemList, setItemList] = useState<RestockShopItem[]>(initialItems);
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(RESTOCK_FILTER(shopInfo.id));
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isFiltered, setFiltered] = useState(false);
  const [viewType, setViewType] = useState<'default' | 'rarity'>(
    userPref?.restock_prefView ?? 'rarity'
  );

  const init = async (forceStats = false) => {
    setLoading(true);
    const shopFilters = RESTOCK_FILTER(shopInfo.id);

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
        })
        .catch(console.error);
    }

    try {
      const res = await axios.get('/api/v2/search', {
        params: {
          ...getFiltersDiff(shopFilters),
        },
      });

      setItemList(res.data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    const filtered = [...itemList]
      .filter((item) =>
        itemSearch ? item.name.toLowerCase().includes(itemSearch.toLowerCase()) : true
      )
      .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));

    setFilteredItems(filtered);
  };

  const resetFilters = (force = false) => {
    setFilters(RESTOCK_FILTER(shopInfo.id));
    setItemSearch('');
    init(force);
    setFiltered(false);
  };

  useEffect(() => {
    resetFilters(true);
  }, [shopInfo.id]);

  useEffect(() => {
    if (initialItems.length === itemList.length) return;

    handleFilterChange();
  }, [itemSearch, itemList]);

  const handleSort = (sortBy: string, sortDir: string) => {
    setSortInfo({ sortBy, sortDir });
    setFilteredItems([...filteredItems].sort((a, b) => sortItems(a, b, sortBy, sortDir)));
  };

  const handleSearch = (query: string) => {
    setItemSearch(query);
  };

  const toggleView = () => {
    const newView = viewType === 'default' ? 'rarity' : 'default';
    setViewType(newView);
    updatePref('restock_prefView', newView);
  };

  const applyFilters = async (newFilters: SearchFilters) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v2/search', {
        params: {
          ...getFiltersDiff(newFilters),
        },
      });

      const data = res.data as { content: RestockShopItem[] };
      const searchResult = data.content
        .filter((item) =>
          itemSearch ? item.name.toLowerCase().includes(itemSearch.toLowerCase()) : true
        )
        .sort((a, b) => sortItems(a, b, sortInfo.sortBy, sortInfo.sortDir));

      setFilteredItems(searchResult);
      setItemList(data.content);
      setFiltered(true);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <SearchFilterModal
          isLists
          isOpen={open}
          onClose={onClose}
          filters={filters}
          stats={stats}
          onChange={(nextFilters) => setFilters(nextFilters)}
          resetFilters={resetFilters}
          applyFilters={applyFilters}
        />
      )}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        gap={3}
        mb={3}
        flexFlow={{ base: 'column-reverse', lg: 'row' }}
      >
        <HStack alignItems="center">
          <CreateDynamicListButton
            removeMargin
            isLoading={loading}
            resultCount={filteredItems.length}
            query={itemSearch || undefined}
            filters={filters}
          />
          <Text as="div" color="gray.300" fontSize="sm">
            {!loading && (
              <>
                {filteredItems.length} {labels.items.toLowerCase()}
              </>
            )}
          </Text>
        </HStack>
        <HStack
          flex="0 0 auto"
          minW={{ base: 'none', md: 400 }}
          justifyContent={['center', 'flex-end']}
          flexWrap="wrap"
        >
          <Button loading={loading} onClick={toggleView}>
            {viewType === 'rarity' ? labels.useClassicView : labels.useRarityView}
          </Button>
          <IconButton
            loading={loading}
            aria-label="search filters"
            onClick={onOpen}
            colorPalette={isFiltered ? 'blue' : undefined}
          >
            <BsFilter />
          </IconButton>
          <SearchList disabled={loading} onChange={handleSearch} />
          <HStack>
            <Text
              flex="0 0 auto"
              color="gray.300"
              fontSize="sm"
              display={{ base: 'none', md: 'inherit' }}
            >
              {labels.sortBy}
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
          items={filteredItems}
          highlightList={restockBlackMarketItems}
        />
      )}
      {viewType === 'rarity' && <RarityView itemList={filteredItems} sortType={sortInfo.sortBy} />}
    </>
  );
}

function getNpPrice(item: RestockShopItem): number | null {
  return item.price?.type === 'np' ? item.price.value : null;
}

function sortItems(a: RestockShopItem, b: RestockShopItem, sortBy: string, sortDir: string) {
  if (sortBy === 'name') {
    if (sortDir === 'asc') return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  }

  if (sortBy === 'rarity') {
    if (sortDir === 'asc') return (a.rarity ?? Infinity) - (b.rarity ?? Infinity);
    return (b.rarity ?? Number.MIN_SAFE_INTEGER) - (a.rarity ?? Number.MIN_SAFE_INTEGER);
  }

  if (sortBy === 'price') {
    const aPrice = getNpPrice(a);
    const bPrice = getNpPrice(b);
    if (sortDir === 'asc') {
      return (
        (aPrice || Number.MIN_SAFE_INTEGER) - (bPrice || Number.MIN_SAFE_INTEGER) ||
        (a.ncValue?.minValue || Number.MIN_SAFE_INTEGER) -
          (b.ncValue?.minValue || Number.MIN_SAFE_INTEGER)
      );
    }
    return (
      (bPrice || Infinity) - (aPrice || Infinity) ||
      (b.ncValue?.minValue || Infinity) - (a.ncValue?.minValue || Infinity)
    );
  }

  if (sortBy === 'item_id') {
    if (sortDir === 'asc') return (a.item_id ?? Infinity) - (b.item_id ?? Infinity);
    return (b.item_id ?? Number.MIN_SAFE_INTEGER) - (a.item_id ?? Number.MIN_SAFE_INTEGER);
  }

  if (sortBy === 'color') {
    const colorA = new Color(a.colorHex ?? '#000000');
    const colorB = new Color(b.colorHex ?? '#000000');
    const hsvA = colorA.hsv().array();
    const hsvB = colorB.hsv().array();
    if (sortDir === 'asc') return hsvB[0] - hsvA[0] || hsvB[1] - hsvA[1] || hsvB[2] - hsvA[2];
    return hsvA[0] - hsvB[0] || hsvA[1] - hsvB[1] || hsvA[2] - hsvB[2];
  }

  if (sortBy === 'profit') {
    if (sortDir === 'asc')
      return (getRestockProfitV2(a) ?? Infinity) - (getRestockProfitV2(b) ?? Infinity);
    return (
      (getRestockProfitV2(b) ?? Number.MIN_SAFE_INTEGER) -
      (getRestockProfitV2(a) ?? Number.MIN_SAFE_INTEGER)
    );
  }

  return 0;
}
