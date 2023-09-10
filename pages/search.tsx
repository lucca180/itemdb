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
import { SelectItemsCheckbox } from '../components/Input/SelectItemsCheckbox';
import ListSelect from '../components/UserLists/ListSelect';
import { useAuth } from '../utils/auth';
import { defaultFilters } from '../utils/parseFilters';
import { CreateDynamicListButton } from '../components/DynamicLists/CreateButton';

const Axios = axios.create({
  baseURL: '/api/v1/',
});

const intl = new Intl.NumberFormat();

const SearchPage = () => {
  const toast = useToast();
  const { user, getIdToken } = useAuth();
  const [searchQuery, setQuery] = useState<string>('');
  const [searchResult, setResult] = useState<SearchResults | null>(null);
  const [searchStatus, setStatus] = useState<SearchStats | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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

    const queryFilters = getFiltersDiff(queryStrings);

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
      title: 'Adding items to list...',
      description: 'This may take a while, please wait...',
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
          title: 'Items added to list',
          status: 'success',
          duration: 5000,
        });
        setSelectedItems([]);
      }
    } catch (err) {
      console.error(err);

      toast.update(toastId, {
        title: 'Oops!',
        description:
          'An error occurred while adding the items to the list, please try again later.',
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
        title: `${router.query.s ? `${router.query.s} -` : ''} Search`,
        canonical: 'https://itemdb.com.br/search',
        noindex: true,
      }}
    >
      <Flex
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
            onChange={handleFilterChange}
            resetFilters={resetFilters}
            applyFilters={() => changeQueryString()}
          />

          <Flex justifyContent={'center'}>
            <CreateDynamicListButton
              resultCount={searchResult?.totalResults}
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
                {searchResult && (
                  <SelectItemsCheckbox
                    checked={selectedItems}
                    allChecked={selectedItems.length === searchResult.content.length}
                    onClick={(checkAll) => selectItem(undefined, checkAll)}
                    defaultText={`
                      Showing ${intl.format(
                        searchResult.resultsPerPage * (searchResult.page - 1) + 1
                      )} -${' '}
                      ${intl.format(
                        Math.min(
                          searchResult.resultsPerPage * searchResult.page,
                          searchResult.totalResults
                        )
                      )}${' '}
                      of ${intl.format(searchResult.totalResults)} results
                    `}
                  />
                )}
                {!searchResult && <Skeleton width="100px" h="15px" />}
                {selectedItems.length > 0 && (
                  <ListSelect
                    defaultText="Add to List"
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
                <option value="owls">Owls Value</option>
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

          <Text
            textAlign={'center'}
            fontSize="xs"
            color="gray.500"
            display={{ base: 'none', lg: 'block' }}
          >
            Tip: you can use right click or ctrl+click to select multiple items
          </Text>

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
