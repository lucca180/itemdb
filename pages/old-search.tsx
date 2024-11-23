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
import { useAuth } from '../utils/auth';
import { defaultFilters } from '../utils/parseFilters';
import { CreateDynamicListButton } from '../components/DynamicLists/CreateButton';
import Color from 'color';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const SearchFilterModal = dynamic<SearchFilterModalProps>(
  () => import('../components/Search/SearchFiltersModal')
);

const Axios = axios.create({
  baseURL: '/api/v1/',
});

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject({ status: 499 });
    }
    return Promise.reject((error.response && error.response.data) || 'Error');
  }
);

const intl = new Intl.NumberFormat();
let ABORT_CONTROLER = new AbortController();

const SearchPage = () => {
  const t = useTranslations();
  const toast = useToast();
  const { user, getIdToken } = useAuth();
  const [searchQuery, setQuery] = useState<string>('');
  const [searchResult, setResult] = useState<SearchResults | null>(null);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const __isNewPage = useRef(false);

  const searchTip = searchTips[new Date().getHours() % searchTips.length];

  const [isLargerThanLG] = useMediaQuery('(min-width: 62em)', { fallback: true });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const color = Color('#4A5568');
  const rgb = color.rgb().round().array();

  useEffect(() => {
    if (router.isReady) {
      const [custom, forceRefresh] = parseQueryString();
      init(custom, forceRefresh);
    }
  }, [router.isReady, router.query]);

  const init = async (customFilters?: SearchFiltersType, forceStats = false) => {
    const query = (router.query.s as string) ?? '';
    setQuery(query);
    setSelectedItems([]);

    if (query.match(/^#[0-9A-Fa-f]{6}$/)) {
      if (!searchResult && !isColorSearch) {
        setIsColorSearch(true);

        customFilters = {
          ...(customFilters ?? filters),
          sortBy:
            (customFilters ?? filters).sortBy !== 'name'
              ? (customFilters ?? filters).sortBy
              : 'color',
        };

        setFilters(customFilters);
      }
    } else setIsColorSearch(false);

    const params = getFiltersDiff({ ...(customFilters ?? filters) });

    setResult(null);
    if (!__isNewPage.current) setTotalResults(null);
    try {
      ABORT_CONTROLER.abort();
      ABORT_CONTROLER = new AbortController();

      if (!totalResults || !__isNewPage.current) {
        Axios.get('search?s=' + encodeURIComponent(query), {
          signal: ABORT_CONTROLER.signal,
          params: { ...params, limit: 1, onlyStats: true },
        })
          .then((res) => {
            setTotalResults(res.data.totalResults);
          })
          .catch(() => {});
      }

      __isNewPage.current = false;

      const [resSearch, resStats] = await Promise.all([
        Axios.get('search?s=' + encodeURIComponent(query), {
          signal: ABORT_CONTROLER.signal,
          params: { ...params, skipStats: true },
        }),

        !searchStatus || forceStats
          ? Axios.get('search/stats?s=' + encodeURIComponent(query), {
              signal: ABORT_CONTROLER.signal,
            })
          : null,
      ]);

      setResult(resSearch.data);
      if (resStats) setStatus(resStats.data);
    } catch (err) {
      toast({
        title: 'An Error Occurred',
        description: 'Please try again',
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = {
      ...filters,
      [e.target.name]: e.target.value,
      page: 1,
    };

    setFilters(newFilter);
    changeQueryString(newFilter);
  };

  const handleFilterChange = (newFilter: SearchFiltersType) => {
    setFilters({
      ...filters,
      ...newFilter,
      page: 1,
    });
  };

  const resetFilters = () => {
    const newFilter = {
      ...defaultFilters,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1,
    };

    setFilters(newFilter);
    changeQueryString(newFilter);
  };

  const changePage = (page: number) => {
    setFilters({ ...filters, page: page });
    changeQueryString({ ...filters, page: page });
    __isNewPage.current = true;
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const parseQueryString = (): [SearchFiltersType, boolean] => {
    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    });

    const queryFilters = getFiltersDiff(queryStrings);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    let customFilters: SearchFiltersType = { ...defaultFilters, ...queryFilters };

    if (Object.keys(queryStrings).length == 1) customFilters = defaultFilters;

    if (searchQuery && searchQuery !== router.query.s) {
      setStatus(null);
      customFilters.page = 1;
    }

    setFilters(customFilters);

    return [customFilters, searchQuery !== router.query.s];
  };

  const changeQueryString = (customFilters?: SearchFiltersType) => {
    const query = (router.query.s as string) ?? '';

    const params = getFiltersDiff({ ...(customFilters ?? filters) });

    let paramsString = qs.stringify(params, {
      arrayFormat: 'brackets',
      encode: false,
    });
    paramsString = paramsString ? '&' + paramsString : '';

    router.push(router.pathname + '?s=' + encodeURIComponent(query) + paramsString, undefined, {
      shallow: true,
    });
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

  const addItemToList = async (list_id: number) => {
    if (!user) return;

    const toastId = toast({
      title: `${t('Lists.adding-items-to-list')}...`,
      description: `${t('Lists.this-may-take-a-while-please-wait')}...`,
      status: 'info',
      duration: null,
      isClosable: true,
    });

    try {
      const token = await getIdToken();

      const items = selectedItems.map((id) => ({ item_iid: id }));

      const res = await axios.put(
        `/api/v1/lists/${user.username}/${list_id}`,
        {
          items: items,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        toast.update(toastId, {
          title: t('Lists.items-added-to-list'),
          status: 'success',
          duration: 5000,
        });
        setSelectedItems([]);
      }
    } catch (err) {
      console.error(err);

      toast.update(toastId, {
        title: t('General.oops'),
        description: t('Lists.errorOccurred'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  const onItemClick = (e: React.MouseEvent<any>, id: number) => {
    if (selectedItems.length <= 0 && !e.ctrlKey) return;

    if (e?.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
    }

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
      <Box
        position="absolute"
        h="50vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      <Flex
        gap={4}
        flexFlow={{ base: 'column', lg: 'row' }}
        alignItems={{ base: 'center', lg: 'flex-start' }}
        pt={3}
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
            onChange={handleFilterChange}
            resetFilters={resetFilters}
            applyFilters={() => changeQueryString()}
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

        {isOpen && (
          <SearchFilterModal
            isOpen={isOpen}
            onClose={onClose}
            filters={filters}
            stats={searchStatus}
            isColorSearch={isColorSearch}
            onChange={handleFilterChange}
            resetFilters={resetFilters}
            applyFilters={() => changeQueryString()}
          />
        )}
        <Box flex="1">
          <Flex
            justifyContent={'space-between'}
            alignItems="center"
            flexFlow={{ base: 'column-reverse', lg: 'row' }}
            gap={3}
          >
            <HStack justifyContent={'space-between'} w="100%">
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
                    onChange={(list) => addItemToList(list.internal_id)}
                  />
                )}
              </Flex>
              {!isLargerThanLG && (
                <HStack gap={3}>
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
            </HStack>
            <Flex
              flex="0 1 auto"
              mx={0}
              minW={{ base: 'none', sm: 350 }}
              w={{ base: '100%', sm: 'auto' }}
              gap={2}
              alignItems="center"
            >
              <Text flex="0 0 auto" textColor={'gray.300'} fontSize={{ base: 'xs', sm: 'sm' }}>
                {t('General.sort-by')}
              </Text>
              <Select
                name="sortBy"
                variant="filled"
                value={filters.sortBy}
                onChange={handleSelectChange}
                size="sm"
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
                isDisabled={!searchResult}
              >
                <option value="asc">{t('General.ascending')}</option>
                <option value="desc">{t('General.descending')}</option>
              </Select>
            </Flex>
          </Flex>

          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.500"
            display={{ base: 'none', lg: 'block' }}
          >
            {t('General.tip')}: {searchTip}
          </Text>

          {searchResult && (
            <Pagination
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

export const getFiltersDiff = (a: { [id: string]: any }, b?: SearchFiltersType) => {
  if (!b) b = defaultFilters;
  const keys = Object.keys(b) as (keyof SearchFiltersType)[];
  const diff = {} as {
    [key in keyof SearchFiltersType]: string | string[] | number;
  };

  for (const key of keys) {
    if (a[key] && JSON.stringify(a[key]) !== JSON.stringify(b[key])) diff[key] = a[key];
  }

  return diff;
};

export default SearchPage;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../translation/${context.locale}.json`)).default,
    },
  };
}

const searchTips = [
  <>
    you can use{' '}
    <Link as={NextLink} href="/articles/advanced-search-queries" color="gray.400">
      Advanced Operators
    </Link>{' '}
    to supercharge your search
  </>,
  <>
    you can create a{' '}
    <Link as={NextLink} href="/articles/checklists-and-dynamic-lists" color="gray.400">
      Dynamic List
    </Link>{' '}
    to keep it always up to date with your search
  </>,
  <>you can use right click or ctrl+click to select multiple items</>,
];
