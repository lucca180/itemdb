import {
  Box,
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
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ItemCard from '../components/Items/ItemCard';
import { SearchStats } from '../types';
import { useRouter } from 'next/router';
import axios from 'axios';
import { SearchFilters as SearchFiltersType, SearchResults } from '../types';
import Pagination from '../components/Input/Pagination';
import qs from 'qs';
import SearchFilterCard from '../components/Search/SearchFiltersCard';
import SearchFilterModal from '../components/Search/SearchFiltersModal';
import { BsFilter } from 'react-icons/bs';

const Axios = axios.create({
  baseURL: '/api/',
});

const defaultFilters: SearchFiltersType = {
  category: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  sortBy: 'name',
  sortDir: 'asc',
  limit: 48,
  page: 1,
};

const SearchPage = () => {
  const toast = useToast();
  const [searchQuery, setQuery] = useState<string>('');
  const [searchResult, setResult] = useState<SearchResults | null>(null);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false);
  const [isLargerThanLG] = useMediaQuery('(min-width: 62em)', { fallback: true });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const [custom, forceRefresh] = parseQueryString();
      init(custom, forceRefresh);
    }
  }, [router.isReady, router.query]);

  const init = async (customFilters?: SearchFiltersType, forceStats = false) => {
    const query = (router.query.s as string) ?? '';
    setQuery(query);

    if (query.match(/^#[0-9A-Fa-f]{6}$/)) {
      if (!searchResult && !isColorSearch) {
        setIsColorSearch(true);
        console.log(customFilters?.sortBy);
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

    const params = getDifference({ ...(customFilters ?? filters) });

    setResult(null);
    try {
      const [resSearch, resStats] = await Promise.all([
        Axios.get('search?s=' + encodeURIComponent(query), {
          params: params,
        }),

        !searchStatus || forceStats
          ? Axios.get('search/stats?s=' + encodeURIComponent(query))
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
  };

  const parseQueryString = (): [SearchFiltersType, boolean] => {
    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    });

    const queryFilters = getDifference(queryStrings);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    let customFilters: SearchFiltersType = { ...defaultFilters, ...queryFilters };

    if (Object.keys(queryStrings).length == 1) customFilters = defaultFilters;

    if (searchQuery !== router.query.s) setStatus(null);
    setFilters(customFilters);

    return [customFilters, searchQuery !== router.query.s];
  };

  const changeQueryString = (customFilters?: SearchFiltersType) => {
    const query = (router.query.s as string) ?? '';

    const params = getDifference({ ...(customFilters ?? filters) });

    let paramsString = qs.stringify(params, {
      arrayFormat: 'brackets',
      encode: false,
    });
    paramsString = paramsString ? '&' + paramsString : '';

    router.push(router.pathname + '?s=' + encodeURIComponent(query) + paramsString, undefined, {
      shallow: true,
    });
  };

  return (
    <Layout SEO={{ title: `${router.query.s ? `${router.query.s} -` : ''} Search` }}>
      <Flex
        gap={4}
        flexFlow={{ base: 'column', lg: 'row' }}
        alignItems={{ base: 'center', lg: 'flex-start' }}
      >
        {isLargerThanLG && (
          <Box flex="1 0 auto" maxW={{ base: 'none', md: '275px' }} w="100%">
            <SearchFilterCard
              filters={filters}
              stats={searchStatus}
              isColorSearch={isColorSearch}
              onChange={handleFilterChange}
              resetFilters={resetFilters}
              applyFilters={() => changeQueryString()}
            />
          </Box>
        )}
        {!isLargerThanLG && (
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
              <Text as="div" textColor={'gray.300'} fontSize={{ base: 'xs', sm: 'sm' }}>
                {searchResult && (
                  <>
                    Showing {searchResult.resultsPerPage * (searchResult.page - 1) + 1} -{' '}
                    {Math.min(
                      searchResult.resultsPerPage * searchResult.page,
                      searchResult.totalResults
                    )}{' '}
                    of {searchResult.totalResults} results
                  </>
                )}
                {!searchResult && <Skeleton width="100px" h="15px" />}
              </Text>
              {!isLargerThanLG && (
                <IconButton aria-label="search filters" onClick={onOpen} icon={<BsFilter />} />
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
                Sort By
              </Text>
              <Select
                name="sortBy"
                variant="filled"
                value={filters.sortBy}
                onChange={handleSelectChange}
                size={{ base: 'sm', sm: 'md' }}
                isDisabled={!searchResult}
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rarity">Rarity</option>
                <option value="color">Color</option>
                <option value="weight">Weight</option>
                <option value="estVal">Est. Val</option>
                <option value="id">ID</option>
              </Select>
              <Select
                name="sortDir"
                variant="filled"
                value={filters.sortDir}
                onChange={handleSelectChange}
                size={{ base: 'sm', sm: 'md' }}
                isDisabled={!searchResult}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </Flex>
          </Flex>
          <Flex mt={4} flexWrap="wrap" gap={{ base: 3, md: 4 }} justifyContent="center">
            {searchResult?.content.map((item) => (
              <ItemCard item={item} key={item.internal_id} />
            ))}
            {!searchResult && [...Array(24)].map((_, i) => <ItemCard key={i} />)}
            {searchResult && searchResult.content.length === 0 && (
              <Center h="60vh" flexFlow="column" gap={3}>
                <Image
                  src="https://images.neopets.com/halloween/tot/2020/1_5WhOgu.png"
                  alt="no results found coltzan"
                  maxW="75%"
                />
                <Text color="gray.400">No results found :(</Text>
              </Center>
            )}
          </Flex>
          {searchResult && (
            <Pagination
              currentPage={searchResult.page}
              totalPages={Math.ceil(searchResult.totalResults / searchResult.resultsPerPage)}
              setPage={changePage}
            />
          )}
          {!searchResult && <Pagination />}
        </Box>
      </Flex>
    </Layout>
  );
};

const getDifference = (a: { [id: string]: any }, b?: SearchFiltersType) => {
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
