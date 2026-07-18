'use client';

import { Button, Flex, HStack, IconButton, Text, useDisclosure } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BsFilter } from 'react-icons/bs';
import { CreateDynamicListButton } from '@components/DynamicLists/CreateButton';
import { RarityView } from '@components/Hubs/Restock/RarityView';
import { SortSelect } from '@components/Input/SortSelect';
import { SearchList } from '@components/Search/SearchLists';
import { VirtualizedItemList } from '@components/Utils/VirtualizedItemList';
import type { ItemV2For, SearchFilters, SearchStats, ShopInfo } from '@types';
import { useAuth } from '@utils/auth';
import { useToast } from '@utils/theme/toast';
import { RESTOCK_FILTER } from '@utils/restock-filters';
import { getRestockProfitV2 } from '@utils/item/v2';
import { restockBlackMarketItems } from '@utils/utils';
import Color from 'color';
import type { RestockShopClientLabels } from './buildRestockShopPageProps';
import { applyRestockFilters, loadRestockShopItems, loadRestockShopStats } from './actions';

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
  routeId: string;
  locale: string;
  shopInfo: ShopInfo;
  initialItems: RestockShopItem[];
  needsFullLoad: boolean;
  labels: RestockShopClientLabels;
};

function deriveFiltered(
  list: RestockShopItem[],
  sortBy: string,
  sortDir: string,
  search: string
): RestockShopItem[] {
  return [...list]
    .filter((item) => (search ? item.name.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => sortItems(a, b, sortBy, sortDir));
}

export function RestockShopPageClient({
  routeId,
  locale,
  shopInfo,
  initialItems,
  needsFullLoad,
  labels,
}: RestockShopPageClientProps) {
  const { userPref, updatePref } = useAuth();
  const t = useTranslations();
  const toast = useToast();
  const { open, onClose, onOpen } = useDisclosure();
  const [filteredItems, setFilteredItems] = useState<RestockShopItem[]>(initialItems);
  const [itemList, setItemList] = useState<RestockShopItem[]>(initialItems);
  const [sortInfo, setSortInfo] = useState({ sortBy: 'price', sortDir: 'desc' });
  const [loading, setLoading] = useState(needsFullLoad);
  const [itemSearch, setItemSearch] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(RESTOCK_FILTER(shopInfo.id));
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isFiltered, setFiltered] = useState(false);
  const [viewType, setViewType] = useState<'default' | 'rarity'>(
    userPref?.restock_prefView ?? 'rarity'
  );

  // --- async race guards (mirrors the list page tier-3 loading) ---
  const requestGenerationRef = useRef(0);
  const deferredLoadKeyRef = useRef<string | null>(null);
  // Kept in sync from event handlers so an async merge always sorts/filters with the latest view.
  const sortInfoRef = useRef(sortInfo);
  const itemSearchRef = useRef(itemSearch);

  const showRefreshError = (id: string) => {
    toast({
      id,
      title: t('General.an-error-occurred'),
      description: t('General.refreshPage'),
      status: 'error',
      duration: null,
    });
  };

  /** Replace the item list (drops stale payloads) and re-derive the visible list. */
  const applyItemList = (list: RestockShopItem[], generation: number) => {
    if (requestGenerationRef.current !== generation) return;
    setItemList(list);
    setFilteredItems(
      deriveFiltered(
        list,
        sortInfoRef.current.sortBy,
        sortInfoRef.current.sortDir,
        itemSearchRef.current
      )
    );
    setLoading(false);
  };

  // Tier 3: load the full profitable list via server action after hydration.
  // `loading` is initialized to `needsFullLoad`, so no setState is needed up front.
  useEffect(() => {
    if (!needsFullLoad) return;

    const deferredLoadKey = `${locale}/${routeId}`;
    if (deferredLoadKeyRef.current === deferredLoadKey) return;
    deferredLoadKeyRef.current = deferredLoadKey;

    const generation = ++requestGenerationRef.current;

    loadRestockShopItems(routeId, locale)
      .then((items) => {
        if (
          deferredLoadKeyRef.current !== deferredLoadKey ||
          requestGenerationRef.current !== generation
        ) {
          return;
        }
        applyItemList(items, generation);
      })
      .catch((err) => {
        console.error(err);
        if (
          deferredLoadKeyRef.current === deferredLoadKey &&
          requestGenerationRef.current === generation
        ) {
          showRefreshError('restock-page-init-error');
          setLoading(false);
        }
      });
  }, [routeId, locale, needsFullLoad]);

  const handleSort = (sortBy: string, sortDir: string) => {
    sortInfoRef.current = { sortBy, sortDir };
    setSortInfo({ sortBy, sortDir });
    setFilteredItems(deriveFiltered(itemList, sortBy, sortDir, itemSearch));
  };

  const handleSearch = (query: string) => {
    itemSearchRef.current = query;
    setItemSearch(query);
    setFilteredItems(deriveFiltered(itemList, sortInfo.sortBy, sortInfo.sortDir, query));
  };

  const toggleView = () => {
    const newView = viewType === 'default' ? 'rarity' : 'default';
    setViewType(newView);
    updatePref('restock_prefView', newView);
  };

  const handleOpenFilters = () => {
    onOpen();
    if (stats) return;

    loadRestockShopStats(routeId, locale)
      .then((result) => {
        if (result) setStats(result);
      })
      .catch(console.error);
  };

  const resetFilters = () => {
    itemSearchRef.current = '';
    setFilters(RESTOCK_FILTER(shopInfo.id));
    setItemSearch('');
    setFiltered(false);

    const generation = ++requestGenerationRef.current;
    setLoading(true);

    loadRestockShopItems(routeId, locale)
      .then((items) => applyItemList(items, generation))
      .catch((err) => {
        console.error(err);
        if (requestGenerationRef.current === generation) {
          showRefreshError('restock-page-reset-error');
          setLoading(false);
        }
      });
  };

  const applyFilters = async (newFilters: SearchFilters) => {
    const generation = ++requestGenerationRef.current;
    setLoading(true);
    try {
      const items = await applyRestockFilters(routeId, locale, newFilters);
      if (requestGenerationRef.current !== generation) return;

      applyItemList(items, generation);
      setFiltered(true);
      onClose();
    } catch (err) {
      console.error(err);
      if (requestGenerationRef.current === generation) {
        showRefreshError('restock-page-filter-error');
        setLoading(false);
      }
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
            onClick={handleOpenFilters}
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
