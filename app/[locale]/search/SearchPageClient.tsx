'use client';

import {
  Badge,
  Box,
  Flex,
  Float,
  HStack,
  IconButton,
  NativeSelect,
  Skeleton,
  Text,
  useDisclosure,
  useMediaQuery,
  Link,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import React, { useEffect, useRef, useState } from 'react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import type { ItemV2For, SearchStats, UserList } from '@types';
import { useSearchParams } from 'next/navigation';
import type { SearchFilters as SearchFiltersType } from '@types';
import Pagination from '@components/Input/Pagination';
import { SearchFilterModalProps } from '@components/Search/SearchFiltersModal';
import { BsFilter } from 'react-icons/bs';
import { SelectItemsCheckbox } from '@components/Input/SelectItemsCheckbox';
import ListSelect from '@components/UserLists/ListSelect';
import { countActiveFilters, defaultFilters, getFiltersDiff } from '@utils/parseFilters';
import { setSearchListScope } from '@components/Search/searchListScope';
import { CreateDynamicListButton } from '@components/DynamicLists/CreateButton';
import Color from 'color';
import MainLink from '@components/Utils/MainLink';
import { OFFICIAL_CRITERIA_URL } from '@utils/list/officialListLinks';
import { useFormatter, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useLists } from '@utils/useLists';
import queryString from 'query-string';
import isEqual from 'lodash/isEqual';
import { ListBreadcrumb } from '@components/Breadcrumbs/ListBreadcrumb';
import { loadSearchStats, runSearch, runSearchCount } from './actions';

const Markdown = dynamic(() => import('@components/Utils/Markdown'));

const SearchFilterModal = dynamic<SearchFilterModalProps>(
  () => import('@components/Search/SearchFiltersModal')
);

const SearchFilterCard = dynamic(() => import('@components/Search/SearchFiltersCard'));

const SearchEmptyState = dynamic(() => import('@components/Search/SearchEmptyState'));

const color = Color('#4A5568');
const rgb = color.rgb().round().array();

type SearchPageResult = {
  content: ItemV2For<'card'>[];
  page: number;
  resultsPerPage: number;
};

type SearchPageClientProps = {
  userList?: UserList | null;
  listJWT?: string | null;
  searchTip: number;
};

function parseSearchQuery(search: string) {
  return queryString.parse(search, {
    arrayFormat: 'bracket',
    parseNumbers: true,
  });
}

function getSearchQuery(search: string): string {
  // without parseNumbers: `?s=13` must stay the text "13", not the number 13
  const s = queryString.parse(search, { arrayFormat: 'bracket' }).s;
  if (typeof s === 'string') return s;
  if (Array.isArray(s) && typeof s[0] === 'string') return s[0];
  return '';
}

export function SearchPageClient(props: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';
  const t = useTranslations();
  const format = useFormatter();
  const { addItemToList } = useLists();
  const toast = useToast();
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchResult, setResult] = useState<SearchPageResult | null>(null);
  const [searchQuery, setQuery] = useState<string | null>(null);
  const [isColorSearch, setIsColorSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const prevFilter = useRef<SearchFiltersType>(null);
  // Set when the page is corrected (out of range) so the fix doesn't add a history entry.
  const replaceHistoryRef = useRef(false);
  const statsKeyRef = useRef<string | null>(null);
  const searchGenerationRef = useRef(0);
  const countGenerationRef = useRef(0);
  const statsGenerationRef = useRef(0);
  const [isLargerThanLG] = useMediaQuery(['(min-width: 62em)'], { fallback: [true] });
  const { open, onOpen, onClose } = useDisclosure();

  const parseQueryString = () => {
    const queryStrings = parseSearchQuery(searchParamsString);
    const queryFilters = getFiltersDiff(queryStrings);
    const currentFilters = getFiltersDiff(filters);

    if (!isEqual(currentFilters, queryFilters)) {
      setFilters({ ...defaultFilters, ...queryFilters });
      return false;
    }

    // Match Pages `router.query.s` handling: new `s` resets to page 1 and lets the
    // filters effect run the search (shallow-push equivalent via router.push).
    if (getSearchQuery(searchParamsString) !== searchQuery && searchQuery !== null) {
      setFilters((oldFilters) => ({
        ...oldFilters,
        page: 1,
      }));
      return false;
    }

    return true;
  };

  const doSearch = async (fetchStats = false, fetchCount = false) => {
    const query = getSearchQuery(searchParamsString);
    const params = getFiltersDiff(filters);
    const statsKey = `${query}\0${params.list_id ?? 0}`;

    if (query !== searchQuery) {
      fetchStats = true;
      fetchCount = true;
    }

    if (statsKeyRef.current !== statsKey) {
      fetchStats = true;
    }

    setQuery(query);
    setSelectedItems([]);

    if (query.match(/^#[0-9A-Fa-f]{6}$/)) {
      if (!searchResult && !isColorSearch) {
        setIsColorSearch(true);
        setFilters((oldFilters) => ({
          ...oldFilters,
          sortBy: oldFilters.sortBy !== 'name' ? oldFilters.sortBy : 'color',
        }));
        return;
      }
    } else setIsColorSearch(false);

    setResult(null);

    if (fetchStats) setStatus(null);
    if (fetchCount) setTotalResults(null);

    // Next.js dispatches server actions sequentially per client. Run the page
    // of results first so cards are not stuck behind count + facet queries.
    const searchGeneration = ++searchGenerationRef.current;
    let resultPage: Pick<SearchPageResult, 'page' | 'resultsPerPage'> | null = null;

    try {
      const result = await runSearch(query, filters, props.listJWT);
      if (searchGenerationRef.current !== searchGeneration) return;
      setResult(result);
      resultPage = result;
    } catch (err) {
      if (searchGenerationRef.current !== searchGeneration) return;
      console.error(err);
      toast({
        id: 'search-error',
        title: t('General.an-error-occurred'),
        description: t('General.try-again-later'),
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }

    if (searchGenerationRef.current !== searchGeneration) return;

    if (fetchCount) {
      const countGeneration = ++countGenerationRef.current;
      runSearchCount(query, filters, props.listJWT)
        .then((count) => {
          if (countGenerationRef.current !== countGeneration) return;
          setTotalResults(count);

          // A page past the end (old link or recent search) shows nothing: move to the last
          // page with results, replacing the history entry instead of adding one.
          if (!resultPage) return;
          const lastPage = Math.max(1, Math.ceil(count / resultPage.resultsPerPage));
          if (resultPage.page <= lastPage) return;

          replaceHistoryRef.current = true;
          setFilters((oldFilters) => ({ ...oldFilters, page: lastPage }));
        })
        .catch((error) => {
          if (countGenerationRef.current !== countGeneration) return;
          console.error(error);
        });
    }

    if (fetchStats) {
      statsKeyRef.current = statsKey;
      const statsGeneration = ++statsGenerationRef.current;
      loadSearchStats(query, params.list_id, props.listJWT)
        .then((stats) => {
          if (statsGenerationRef.current !== statsGeneration) return;
          setStatus(stats);
        })
        .catch((error) => {
          if (statsGenerationRef.current !== statsGeneration) return;
          if (statsKeyRef.current === statsKey) statsKeyRef.current = null;
          console.error(error);
        });
    }
  };

  const changeQueryString = (replace = false) => {
    const query = getSearchQuery(searchParamsString);

    if (!prevFilter.current) return;
    const newParams = getFiltersDiff(filters);
    const oldParams = getFiltersDiff(prevFilter.current);

    if (isEqual(newParams, oldParams)) return;

    const currentQuery = parseSearchQuery(searchParamsString);
    if (
      getSearchQuery(searchParamsString) === query &&
      isEqual(getFiltersDiff(currentQuery), newParams)
    ) {
      return;
    }

    let paramsString = queryString.stringify(newParams, {
      arrayFormat: 'bracket',
      encode: false,
    });

    paramsString = paramsString ? '&' + paramsString : '';

    // Query-only History API: App Router equivalent of Pages `shallow: true`.
    // `router.push` is a real navigation (RSC + action queue). `pathname + query`
    // with next-intl's locale-stripped pathname would also drop `/pt`.
    const url = '?s=' + encodeURIComponent(query) + paramsString;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  };

  // Mirror Pages effect on `router.query`: only sync filters from the URL.
  // Search runs via the filters effect (including after back/forward).
  useEffect(() => {
    if (!prevFilter.current) return;
    parseQueryString();
  }, [searchParamsString]);

  useEffect(() => {
    if (!prevFilter.current && !parseQueryString()) return;

    const replaceHistory = replaceHistoryRef.current;
    replaceHistoryRef.current = false;

    doSearch(undefined, shouldUpdateCount(filters, prevFilter.current));
    changeQueryString(replaceHistory);
    prevFilter.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!props.userList) return;

    setSearchListScope({ id: props.userList.internal_id, name: props.userList.name });
    return () => setSearchListScope(null);
  }, [props.userList]);

  const selectItem = (id?: number, checkAll?: boolean) => {
    if (!id && !checkAll) setSelectedItems([]);
    else if (checkAll) {
      const ids = searchResult?.content.map((item) => item.internal_id) ?? [];
      setSelectedItems(ids);
    } else if (id && !checkAll) {
      if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter((i) => i !== id));
      else setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((oldFilter) => ({
      ...oldFilter,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  const applyFilterChange = (newFilter: SearchFiltersType) => {
    setFilters((oldFilters) => ({
      ...oldFilters,
      ...newFilter,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1,
    });
  };

  const changePage = (page: number) => {
    setFilters((oldFilters) => ({ ...oldFilters, page: page }));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleAddItemToList = async (list_id: number) => {
    const listPromise = addItemToList(list_id, selectedItems);

    toast.promise(listPromise, {
      success: {
        id: 'search-add-items-success',
        title: t('Lists.items-added-to-list'),
        duration: 3000,
      },
      error: {
        id: 'search-add-items-error',
        title: t('General.oops'),
        description: t('Lists.errorOccurred'),
      },
      loading: {
        id: 'search-add-items-loading',
        title: `${t('Lists.adding-items-to-list')}...`,
        description: `${t('Lists.this-may-take-a-while-please-wait')}...`,
        duration: Infinity,
        isClosable: true,
      },
    });

    listPromise
      .then(() => setSelectedItems([]))
      .catch((err) => {
        console.error(err);
      });
  };

  // Clears what hides the results; keeps the display choices and the list scope.
  const clearFilters = () => {
    setFilters({
      ...defaultFilters,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      limit: filters.limit,
      list_id: filters.list_id,
      page: 1,
    });
  };

  const activeFilterCount = countActiveFilters(filters);
  // Read from the URL so it shows on the first render, before the search runs.
  const urlQuery = getSearchQuery(searchParamsString).trim();

  // Hidden while a page past the end is being corrected, so it never reads "Showing 193 - 1".
  const showingRange = (() => {
    if (totalResults === null || !searchResult) return null;

    const first = searchResult.resultsPerPage * (searchResult.page - 1) + 1;
    if (totalResults > 0 && first > totalResults) return null;

    return {
      first,
      last: Math.min(searchResult.resultsPerPage * searchResult.page, totalResults),
      total: totalResults,
      pageSize: searchResult.content.length,
    };
  })();

  const onItemClick = (_e: React.MouseEvent, id: number) => {
    if (selectedItems.length <= 0) return;
    selectItem(id);
  };

  return (
    <>
      {open && (
        <SearchFilterModal
          isOpen={open}
          onClose={onClose}
          filters={filters}
          stats={searchStatus}
          isColorSearch={isColorSearch}
          resetFilters={resetFilters}
          applyFilters={applyFilterChange}
        />
      )}
      <Box position="absolute" h="20vh" left="0" width="100%" bg="blackAlpha.200" zIndex={-1} />
      <Flex
        position="relative"
        w="100%"
        mx="auto"
        py={3}
        alignItems="center"
        justifyContent="space-between"
        flexDir={{ base: 'column-reverse', lg: 'row' }}
        gap={3}
        textAlign="center"
      >
        <HStack justifyContent="space-between">
          <Flex color="gray.300" fontSize={{ base: 'xs', sm: 'sm' }} gap={3}>
            {showingRange && (
              <SelectItemsCheckbox
                checked={selectedItems}
                allChecked={selectedItems.length === showingRange.pageSize}
                onClick={(checkAll) => selectItem(undefined, checkAll)}
                defaultText={
                  showingRange.total === 0
                    ? t('Search.zero-results')
                    : t('Search.showing', {
                        val1: format.number(showingRange.first),
                        val2: format.number(showingRange.last),
                        val3: format.number(showingRange.total),
                      })
                }
              />
            )}
            {!showingRange && <Skeleton width="100px" h="15px" />}
            {activeFilterCount > 0 && (
              <Badge
                alignSelf="center"
                size="sm"
                colorPalette={totalResults === 0 ? 'orange' : 'gray'}
                flexShrink={0}
              >
                {t('Search.x-filters', { count: activeFilterCount })}
              </Badge>
            )}
            {selectedItems.length > 0 && (
              <ListSelect
                defaultText={t('Lists.add-to-list')}
                size="sm"
                createNew
                onChange={(list) => handleAddItemToList(list.internal_id)}
                trackEvent="search-add-to-list"
                loginSource="search"
                loginTrigger="search-add-to-list"
              />
            )}
          </Flex>
          <Box display={{ base: 'block', lg: 'none' }}>
            {!isLargerThanLG && (
              <HStack gap={2}>
                {!props.userList && (
                  <CreateDynamicListButton
                    resultCount={totalResults ?? undefined}
                    isLoading={!searchResult}
                    filters={filters}
                    query={searchQuery ?? ''}
                    isMobile
                  />
                )}
                <Box position="relative" display={{ base: 'inherit', lg: 'none' }}>
                  <IconButton aria-label="search filters" onClick={onOpen}>
                    <BsFilter />
                  </IconButton>
                  {activeFilterCount > 0 && (
                    <Float placement="top-end" offset={1}>
                      <Badge
                        size="xs"
                        variant="solid"
                        colorPalette={totalResults === 0 ? 'orange' : 'blue'}
                        borderRadius="full"
                        pointerEvents="none"
                      >
                        {activeFilterCount}
                      </Badge>
                    </Float>
                  )}
                </Box>
              </HStack>
            )}
          </Box>
        </HStack>
        <Flex
          flex="0 1 auto"
          mx={0}
          minW={{ base: 'none', sm: 350 }}
          w={{ base: '100%', sm: 'auto' }}
          flexDir={{ base: 'column', sm: 'row' }}
          gap={2}
          alignItems="center"
        >
          <Text flex="0 0 auto" color="gray.300" fontSize={{ base: 'xs', sm: 'sm' }}>
            {t('General.sort-by')}
          </Text>
          <HStack gap={2} flex="0 1 auto">
            <NativeSelect.Root variant="subtle" size="sm" disabled={!searchResult} minW="110px">
              <NativeSelect.Field
                name="sortBy"
                value={filters.sortBy}
                onChange={handleSelectChange}
                fontSize={['xs', 'sm']}
              >
                <option value="name">{t('General.name')}</option>
                <option value="price">{t('General.price')}</option>
                <option value="ncValue">{t('ItemPage.nc-value')}</option>
                <option value="rarity">{t('General.rarity')}</option>
                <option value="color">{t('General.color')}</option>
                <option value="weight">{t('General.weight')}</option>
                <option value="estVal">{t('General.est-val')}</option>
                <option value="id">{t('General.id')}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <NativeSelect.Root variant="subtle" size="sm" disabled={!searchResult} minW="110px">
              <NativeSelect.Field
                name="sortDir"
                value={filters.sortDir}
                onChange={handleSelectChange}
                fontSize={['xs', 'sm']}
              >
                <option value="asc">{t('General.ascending')}</option>
                <option value="desc">{t('General.descending')}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <NativeSelect.Root variant="subtle" size="sm" disabled={!searchResult} minW="110px">
              <NativeSelect.Field
                name="limit"
                value={String(filters.limit)}
                onChange={handleSelectChange}
                fontSize={['xs', 'sm']}
              >
                <option value="30">{t('General.x-per-page', { x: 30 })}</option>
                <option value="48">{t('General.x-per-page', { x: 48 })}</option>
                <option value="96">{t('General.x-per-page', { x: 96 })}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
        </Flex>
      </Flex>
      <Box
        position="absolute"
        h="50vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      <Flex
        mt={3}
        gap={4}
        flexFlow={{ base: 'column', lg: 'row' }}
        alignItems={{ base: 'center', lg: 'flex-start' }}
      >
        <Box
          flex="1 0 auto"
          display={{ base: 'none', lg: 'block' }}
          maxW={{ base: 'none', md: '275px' }}
          w="100%"
        >
          {props.userList && <SpecialListSearch userList={props.userList} />}
          <SearchFilterCard
            filters={filters}
            stats={searchStatus}
            isColorSearch={isColorSearch}
            resetFilters={resetFilters}
            applyFilters={applyFilterChange}
          />
          {!props.userList && (
            <Flex justifyContent="center">
              <CreateDynamicListButton
                resultCount={totalResults ?? undefined}
                isLoading={!searchResult}
                filters={filters}
                query={searchQuery ?? ''}
              />
            </Flex>
          )}
        </Box>
        {/* full width so a long query line truncates instead of widening the page on mobile */}
        <Box flex="1" w="100%" minW={0}>
          {/* The query takes the tip's spot (the tip moves to the bottom); no query keeps the tip */}
          {urlQuery ? (
            <Text
              as="h1"
              textAlign="center"
              fontSize="sm"
              color="whiteAlpha.600"
              truncate
              px={2}
              title={urlQuery}
            >
              {t.rich('Search.results-for', {
                query: urlQuery,
                Query: (chunk) => (
                  <Text as="span" color="whiteAlpha.800">
                    {chunk}
                  </Text>
                ),
              })}
            </Text>
          ) : (
            <Text
              textAlign="center"
              fontSize="xs"
              color="whiteAlpha.600"
              display={{ base: 'none', lg: 'block' }}
            >
              <SearchTips searchTip={props.searchTip} />
            </Text>
          )}
          {!isLargerThanLG && props.userList && <SpecialListSearch userList={props.userList} />}
          {searchResult && (
            <Pagination
              mt={2}
              currentPage={searchResult.page}
              totalPages={Math.ceil((totalResults ?? 1000) / searchResult.resultsPerPage)}
              setPage={changePage}
            />
          )}
          {!searchResult && <Pagination mt={2} />}
          <Flex mt={4} flexWrap="wrap" gap={{ base: 3, md: 4 }} justifyContent="center">
            {searchResult?.content.map((item) => (
              <Box
                key={item.internal_id}
                onClick={(e) => onItemClick(e, item.internal_id)}
                cursor={selectedItems.length > 0 ? 'pointer' : 'default'}
              >
                <ItemCardV2
                  uniqueID="search"
                  item={item}
                  onSelect={() => selectItem(item.internal_id)}
                  disableLink={selectedItems.length > 0}
                  disablePrefetch
                  selected={selectedItems.includes(item.internal_id)}
                />
              </Box>
            ))}
            {!searchResult &&
              [...Array(48)].map((_, i) => <ItemCardV2 uniqueID="search" key={i} />)}
            {searchResult && searchResult.content.length === 0 && (
              <SearchEmptyState
                query={urlQuery}
                filters={filters}
                stats={searchStatus}
                totalResults={totalResults}
                isColorSearch={isColorSearch}
                listJWT={props.listJWT}
                onClearFilters={clearFilters}
              />
            )}
          </Flex>
          {searchResult && (
            <Pagination
              currentPage={searchResult.page}
              totalPages={Math.ceil((totalResults ?? 1000) / searchResult.resultsPerPage)}
              setPage={changePage}
            />
          )}
          {!searchResult && <Pagination />}
          {urlQuery && (
            <Text
              mt={4}
              textAlign="center"
              fontSize="xs"
              color="whiteAlpha.600"
              display={{ base: 'none', lg: 'block' }}
            >
              <SearchTips searchTip={props.searchTip} />
            </Text>
          )}
        </Box>
      </Flex>
    </>
  );
}

const shouldUpdateCount = (newFilter: SearchFiltersType, prevFilter: SearchFiltersType | null) => {
  const diff = getFiltersDiff(newFilter, prevFilter ?? undefined);
  const keys = Object.keys(diff) as (keyof SearchFiltersType)[];
  const dontUpdateCountKeys = ['page', 'resultsPerPage', 'sortDir', 'sortBy'];

  return keys.some((key) => !dontUpdateCountKeys.includes(key));
};

const SearchTips = (props: { searchTip: number }) => {
  const { searchTip } = props;
  const t = useTranslations();

  return (
    <>
      {t('General.tip')}:{' '}
      {searchTip === 0 &&
        t.rich('Search.tip-advanced-operators', {
          Link: (chunk) => (
            <Link asChild color="whiteAlpha.800">
              <MainLink viaNextLink href="/articles/advanced-search-queries" prefetch={false}>
                {chunk}
              </MainLink>
            </Link>
          ),
        })}
      {searchTip === 1 &&
        t.rich('Search.tip-dynamic-lists', {
          Link: (chunk) => (
            <Link asChild color="whiteAlpha.800">
              <MainLink viaNextLink href="/articles/checklists-and-dynamic-lists" prefetch={false}>
                {chunk}
              </MainLink>
            </Link>
          ),
        })}
      {searchTip === 2 &&
        t.rich('Search.tip-price-calculator', {
          Link: (chunk) => (
            <Link asChild color="whiteAlpha.800">
              <MainLink viaNextLink href="/tools/price-calculator" prefetch={false}>
                {chunk}
              </MainLink>
            </Link>
          ),
        })}
      {searchTip === 3 &&
        t.rich('Search.tip-advanced-import', {
          Link: (chunk) => (
            <Link asChild color="whiteAlpha.800">
              <MainLink viaNextLink href="/lists/import/advanced" prefetch={false}>
                {chunk}
              </MainLink>
            </Link>
          ),
        })}
      {searchTip === 4 &&
        t.rich('Search.tip-official-lists', {
          Link: (chunk) => (
            <Link asChild color="whiteAlpha.800">
              <MainLink
                viaNextLink
                href={OFFICIAL_CRITERIA_URL}
                prefetch={false}
                trackEvent="official-criteria-cta"
                trackEventLabel="search-tip"
              >
                {chunk}
              </MainLink>
            </Link>
          ),
        })}
    </>
  );
};

const SpecialListSearch = (props: { userList: UserList }) => {
  return (
    <Flex
      bg="blackAlpha.400"
      p={4}
      borderRadius="md"
      mb={4}
      flexDir="column"
      alignItems="center"
      textAlign="center"
    >
      <Text opacity={0.66} fontSize="xs" as="div">
        <ListBreadcrumb list={props.userList} show={2} skipCurrent useAppDir />
      </Text>
      <Text mb={2} fontSize="lg" fontWeight="bold">
        {props.userList.name}
      </Text>
      <Text
        fontSize="sm"
        as="div"
        color="whiteAlpha.700"
        css={{ '& a': { color: 'whiteAlpha.800', fontWeight: 'bold' } }}
      >
        {props.userList.description && <Markdown>{props.userList.description}</Markdown>}
      </Text>
    </Flex>
  );
};
