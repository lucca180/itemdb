import {
  Box,
  // Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Image,
  Select,
  Skeleton,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  Link,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import ItemCard from '../components/Items/ItemCard';
import { SearchStats } from '../types';
import { useRouter } from 'next/router';
import axios from 'axios';
import { SearchFilters as SearchFiltersType, SearchResults } from '../types';
import Pagination from '../components/Input/Pagination';
import qs from 'qs';
import SearchFilterCard from '../components/Search/SearchFiltersCard';
import { SearchFilterModalProps } from '../components/Search/SearchFiltersModal';
import { BsFilter } from 'react-icons/bs';
import { SelectItemsCheckbox } from '../components/Input/SelectItemsCheckbox';
import ListSelect from '../components/UserLists/ListSelect';
import { defaultFilters } from '../utils/parseFilters';
import { CreateDynamicListButton } from '../components/DynamicLists/CreateButton';
import Color from 'color';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useLists } from '../utils/useLists';

const SearchFilterModal = dynamic<SearchFilterModalProps>(
  () => import('../components/Search/SearchFiltersModal')
);

const itemdb = axios.create({
  baseURL: '/api/v1/',
});

itemdb.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject({ status: 499 });
    }
    return Promise.reject((error.response && error.response.data) || 'Error');
  }
);

const intl = new Intl.NumberFormat();
const color = Color('#4A5568');
const rgb = color.rgb().round().array();

let ABORT_CONTROLLER = new AbortController();

const SearchPage = () => {
  const router = useRouter();
  const t = useTranslations();
  const { addItemToList } = useLists();
  const toast = useToast();
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchResult, setResult] = useState<SearchResults | null>(null);
  const [searchQuery, setQuery] = useState<string>('');
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const prevFilter = useRef<SearchFiltersType>(null);
  const [isLargerThanLG] = useMediaQuery('(min-width: 62em)', { fallback: true });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const searchTip = searchTips[new Date().getHours() % searchTips.length];

  useEffect(() => {
    parseQueryString();
  }, [router.query]);

  useEffect(() => {
    if (!router.isReady) return;

    doSearch(undefined, shouldUpdateCount(filters, prevFilter.current));
    changeQueryString();
    prevFilter.current = filters;
  }, [filters, router.isReady]);

  const doSearch = async (fetchStats = false, fetchCount = false) => {
    const query = (router.query.s as string) ?? '';
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

    const params = getFiltersDiff(filters);
    setResult(null);

    fetchStats = fetchStats || !totalResults;
    fetchCount = fetchCount || !searchResult;

    if (fetchStats) setStatus(null);
    if (fetchCount) setTotalResults(null);

    try {
      ABORT_CONTROLLER.abort();
      ABORT_CONTROLLER = new AbortController();

      if (fetchCount) {
        itemdb
          .get('search', {
            signal: ABORT_CONTROLLER.signal,
            params: {
              ...params,
              s: query,
              limit: 1,
              onlyStats: true,
            },
          })
          .then((res) => setTotalResults(res.data.totalResults))
          .catch();
      }

      if (fetchStats) {
        itemdb
          .get('search/stats', {
            signal: ABORT_CONTROLLER.signal,
            params: {
              s: query,
            },
          })
          .then((res) => setStatus(res.data));
      }

      itemdb
        .get('search', {
          signal: ABORT_CONTROLLER.signal,
          params: {
            ...params,
            skipStats: true,
            s: query,
          },
        })
        .then((res) => setResult(res.data));
    } catch (err) {
      toast({
        title: t('General.an-error-occurred'),
        description: t('General.try-again-later'),
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

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
    const newFilter = {
      ...defaultFilters,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1,
    };

    setFilters(newFilter);
  };

  const changePage = (page: number) => {
    setFilters((oldFilters) => ({ ...oldFilters, page: page }));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const parseQueryString = () => {
    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    });

    const queryFilters = getFiltersDiff(queryStrings, filters);

    if (Object.keys(queryFilters).length > 0) {
      setFilters((oldFilters) => ({
        ...oldFilters,
        ...queryFilters,
      }));
    } else if (!!router.query.s && !!searchQuery && router.query.s !== searchQuery) {
      doSearch(true, true);
    }
  };

  const changeQueryString = () => {
    const query = (router.query.s as string) ?? '';

    if (!prevFilter.current) return;
    const newParams = getFiltersDiff(filters, prevFilter.current);

    if (!Object.keys(newParams).length) return;

    let paramsString = qs.stringify(newParams, {
      arrayFormat: 'brackets',
      encode: false,
    });

    paramsString = paramsString ? '&' + paramsString : '';

    router.push(router.pathname + '?s=' + encodeURIComponent(query) + paramsString, undefined, {
      shallow: true,
    });
  };

  const handleAddItemToList = async (list_id: number) => {
    const listPromise = addItemToList(list_id, selectedItems);

    toast.promise(listPromise, {
      success: { title: t('Lists.items-added-to-list'), duration: 3000 },
      error: { title: t('General.oops'), description: t('Lists.errorOccurred') },
      loading: {
        title: `${t('Lists.adding-items-to-list')}...`,
        description: `${t('Lists.this-may-take-a-while-please-wait')}...`,
        duration: null,
        isClosable: true,
      },
    });

    listPromise
      .then(() => setSelectedItems([]))
      .catch((err) => {
        console.error(err);
      });
  };

  const onItemClick = (e: React.MouseEvent<any>, id: number) => {
    if (selectedItems.length <= 0) return;

    selectItem(id);
  };

  return (
    <Layout
      SEO={{
        title: `${router.query.s ? `${router.query.s} -` : ''} ${t('Search.search')}`,
        canonical: 'https://itemdb.com.br/search',
        noindex: true,
        nofollow: true,
      }}
      mainColor="#4A5568c7"
    >
      {isOpen && (
        <SearchFilterModal
          isOpen={isOpen}
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
        position={'relative'}
        w="100%"
        mx="auto"
        py={3}
        alignItems={'center'}
        justifyContent={'space-between'}
        flexDir={{ base: 'column-reverse', lg: 'row' }}
        gap={3}
        textAlign={'center'}
      >
        <HStack justifyContent={'space-between'}>
          <Flex textColor={'gray.300'} fontSize={{ base: 'xs', sm: 'sm' }} gap={3}>
            {totalResults !== null && searchResult && (
              <SelectItemsCheckbox
                checked={selectedItems}
                allChecked={selectedItems.length === searchResult.content.length}
                onClick={(checkAll) => selectItem(undefined, checkAll)}
                defaultText={t('Search.showing', {
                  val1: intl.format(searchResult.resultsPerPage * (searchResult.page - 1) + 1),
                  val2: intl.format(
                    Math.min(searchResult.resultsPerPage * searchResult.page, totalResults)
                  ),
                  val3: intl.format(totalResults),
                })}
              />
            )}
            {(!searchResult || totalResults === null) && <Skeleton width="100px" h="15px" />}
            {selectedItems.length > 0 && (
              <ListSelect
                defaultText={t('Lists.add-to-list')}
                size="sm"
                createNew
                onChange={(list) => handleAddItemToList(list.internal_id)}
              />
            )}
          </Flex>
          <Box display={{ base: 'block', lg: 'none' }}>
            {!isLargerThanLG && (
              <HStack gap={2}>
                <CreateDynamicListButton
                  resultCount={searchResult?.totalResults}
                  isLoading={!searchResult}
                  filters={filters}
                  query={searchQuery}
                  isMobile
                />
                <IconButton
                  aria-label="search filters"
                  onClick={onOpen}
                  icon={<BsFilter />}
                  display={{ base: 'inherit', lg: 'none' }}
                />
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
          <Text flex="0 0 auto" textColor={'gray.300'} fontSize={{ base: 'xs', sm: 'sm' }}>
            {t('General.sort-by')}
          </Text>
          <HStack gap={2} flex="0 1 auto">
            <Select
              name="sortBy"
              variant="filled"
              value={filters.sortBy}
              onChange={handleSelectChange}
              size="sm"
              fontSize={['xs', 'sm']}
              isDisabled={!searchResult}
            >
              <option value="name">{t('General.name')}</option>
              <option value="price">{t('General.price')}</option>
              <option value="owls">{t('ItemPage.owls-value')}</option>
              <option value="rarity">{t('General.rarity')}</option>
              <option value="color">{t('General.color')}</option>
              <option value="weight">{t('General.weight')}</option>
              <option value="estVal">{t('General.est-val')}</option>
              <option value="id">{t('General.id')}</option>
            </Select>
            <Select
              name="sortDir"
              variant="filled"
              value={filters.sortDir}
              onChange={handleSelectChange}
              size="sm"
              fontSize={['xs', 'sm']}
              isDisabled={!searchResult}
            >
              <option value="asc">{t('General.ascending')}</option>
              <option value="desc">{t('General.descending')}</option>
            </Select>
            <Select
              name="limit"
              variant="filled"
              value={filters.limit}
              onChange={handleSelectChange}
              size="sm"
              fontSize={['xs', 'sm']}
              isDisabled={!searchResult}
            >
              <option value="30">{t('General.x-per-page', { x: 30 })}</option>
              <option value="48">{t('General.x-per-page', { x: 48 })}</option>
              <option value="96">{t('General.x-per-page', { x: 96 })}</option>
            </Select>
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
          <SearchFilterCard
            filters={filters}
            stats={searchStatus}
            isColorSearch={isColorSearch}
            resetFilters={resetFilters}
            applyFilters={applyFilterChange}
          />

          <Flex justifyContent={'center'}>
            <CreateDynamicListButton
              resultCount={totalResults ?? undefined}
              isLoading={!searchResult}
              filters={filters}
              query={searchQuery}
            />
          </Flex>
        </Box>
        <Box flex="1">
          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.500"
            display={{ base: 'none', lg: 'block' }}
          >
            {t('General.tip')}:{' '}
            {t.rich(searchTip.tag, {
              Link: (chunk) => (
                <Link as={NextLink} href={searchTip.href} color="gray.400">
                  {chunk}
                </Link>
              ),
            })}
          </Text>
          {searchResult && (
            <Pagination
              mt={2}
              currentPage={searchResult.page}
              totalPages={Math.ceil((totalResults ?? 1000) / searchResult.resultsPerPage)}
              setPage={changePage}
            />
          )}
          {!searchResult && <Pagination />}
          <Flex mt={4} flexWrap="wrap" gap={{ base: 3, md: 4 }} justifyContent="center">
            {searchResult?.content.map((item) => (
              <Box
                key={item.internal_id}
                onClick={(e) => onItemClick(e, item.internal_id)}
                cursor={selectedItems.length > 0 ? 'pointer' : 'default'}
              >
                <ItemCard
                  item={item}
                  onSelect={() => selectItem(item.internal_id)}
                  disableLink={selectedItems.length > 0}
                  disablePrefetch
                  selected={selectedItems.includes(item.internal_id)}
                />
              </Box>
            ))}
            {!searchResult && [...Array(48)].map((_, i) => <ItemCard key={i} />)}
            {searchResult && searchResult.content.length === 0 && (
              <Center h="60vh" flexFlow="column" gap={3}>
                <Image
                  src="https://images.neopets.com/halloween/tot/2020/1_5WhOgu.png"
                  alt="no results found coltzan"
                  maxW="75%"
                />
                <Text color="gray.400">{t('Layout.no-results-found')} :(</Text>
              </Center>
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
        </Box>
      </Flex>
    </Layout>
  );
};

export default SearchPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../translation/${context.locale}.json`)).default,
    },
  };
}

export const getFiltersDiff = (
  a: { [id: string]: any },
  b?: SearchFiltersType
): Partial<SearchFiltersType> => {
  if (!b) b = defaultFilters;
  const keys = Object.keys(b) as (keyof SearchFiltersType)[];
  const diff = {} as {
    [key in keyof SearchFiltersType]: any;
  };

  for (const key of keys) {
    if (a[key] && a[key] != b[key] && JSON.stringify(a[key]) != JSON.stringify(b[key]))
      diff[key] = a[key];
  }

  return diff as Partial<SearchFiltersType>;
};

const shouldUpdateCount = (newFilter: SearchFiltersType, prevFilter: SearchFiltersType | null) => {
  const diff = getFiltersDiff(newFilter, prevFilter ?? undefined);
  const keys = Object.keys(diff) as (keyof SearchFiltersType)[];
  const dontUpdateCountKeys = ['page', 'resultsPerPage', 'sortDir', 'sortBy'];

  return keys.some((key) => !dontUpdateCountKeys.includes(key));
};

const searchTips = [
  {
    _id: 'Advanced Operators',
    tag: 'Search.tip-advanced-operators',
    href: '/articles/advanced-search-queries',
  },
  {
    _id: 'Dynamic Lists',
    tag: 'Search.tip-dynamic-lists',
    href: '/articles/checklists-and-dynamic-lists',
  },
];
