import {
  Box,
  Center,
  Flex,
  HStack,
  IconButton,
  Select,
  Skeleton,
  Text,
  useDisclosure,
  useMediaQuery,
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
  limit: 30,
  page: 1,
};

const SearchPage = () => {
  const [searchResult, setResult] = useState<SearchResults | null>(null);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false);
  const [isLargerThanLG] = useMediaQuery('(min-width: 62em)');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const custom = parseQueryString();
      init(custom);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    setResult(null);
    setStatus(null);

    const custom = parseQueryString();
    init(custom, true);
  }, [router.query]);

  const init = async (customFilters?: SearchFiltersType, forceStats = false) => {
    const query = (router.query.s as string) ?? '';

    // if(!query) return;

    if (query.match(/^#[0-9A-Fa-f]{6}$/)) {      
      if (!searchResult && !isColorSearch) {
        setIsColorSearch(true);
        setFilters({ ...filters, sortBy: 'color' });
        customFilters = {
          ...(customFilters ?? filters),
          sortBy: 'color',
        };
      }
    } else setIsColorSearch(false);

    const params = getDifference({ ...(customFilters ?? filters) });

    let paramsString = qs.stringify(params, {
      arrayFormat: 'brackets',
      encode: false,
    });
    paramsString = paramsString ? '&' + paramsString : '';

    // changing route will call useEffect again, so we return here
    if (filters && searchResult) {
      router.push(router.pathname + '?s=' + encodeURIComponent(query) + paramsString, undefined, {
        shallow: true,
      });

      return;
    }

    setResult(null);

    const [resSearch, resStats] = await Promise.all([
      Axios.get('search?s=' + encodeURIComponent(query), {
        params: params,
      }),

      !searchStatus || forceStats ? Axios.get('search/stats?s=' + encodeURIComponent(query)) : null,
    ]);

    setResult(resSearch.data);
    if (resStats) setStatus(resStats.data);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = {
      ...filters,
      [e.target.name]: e.target.value,
      page: 1,
    };

    setFilters(newFilter);
    init(newFilter);
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
    init(newFilter);
  };

  const changePage = (page: number) => {
    setFilters({ ...filters, page: page });
    init({ ...filters, page: page });
  };

  const parseQueryString = () => {
    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    });
    const queryFilters = getDifference(queryStrings, filters);

    let customFilters = filters;
    if (JSON.stringify(queryFilters) !== '{}') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      customFilters = { ...filters, ...queryFilters };
    }

    setFilters(customFilters);

    return customFilters;
  };

  return (
    <Layout>
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
              applyFilters={() => init()}
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
            applyFilters={() => init()}
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
                {searchResult && <>{searchResult?.total_results} results</>}
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
              <Center>
                <Text color="gray.400">No results found</Text>
              </Center>
            )}
          </Flex>
          {searchResult && (
            <Pagination
              currentPage={searchResult.page}
              totalPages={Math.ceil(searchResult.total_results / searchResult.results_per_page)}
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
