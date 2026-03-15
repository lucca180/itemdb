import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  InputRightElement,
  CloseButton,
  Text,
  Flex,
  Kbd,
  Heading,
  VStack,
  Image,
  Box,
  HStack,
  VisuallyHidden,
  SkeletonText,
  Skeleton,
} from '@chakra-ui/react';
import { ItemCardBadge } from '@components/Items/ItemCard';
import ItemCtxMenu, { CtxTrigger } from '@components/Menus/ItemCtxMenu';
import { getListLink } from '@components/UserLists/ListCard';
import { ItemData, UserList, ShopInfo } from '@types';
import { slugify } from '@utils/utils';
import axios from 'axios';
import debounce from 'lodash/debounce';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GrSearchAdvanced } from 'react-icons/gr';
import { IoSearchOutline } from 'react-icons/io5';
import { MdArrowDownward, MdArrowUpward, MdOutlineKeyboardReturn } from 'react-icons/md';
import queryString from 'query-string';
import { useRouter } from 'next/router';
import { getFiltersDiff, parseFilters } from '@utils/parseFilters';
import { useTranslations } from 'next-intl';

type SearchCard =
  | { index: number; type: 'item'; data: ItemData }
  | { index: number; type: 'list'; data: UserList }
  | { index: number; type: 'my-lists'; data: UserList }
  | { index: number; type: 'shop'; data: ShopInfo }
  | { index: number; type: 'search'; query: string; url: string };

type SearchResult = {
  items: ItemData[];
  officialLists: UserList[];
  userLists: UserList[];
  restockShop: ShopInfo[];
};

let ABORT_CONTROLLER = new AbortController();

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SearchModal = (props: SearchModalProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { isOpen, onClose } = props;
  const [search, setSearch] = useState<string>('');
  const [searchCards, setSearchCards] = useState<SearchCard[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = searchCards.filter((card) => card.type === 'item');
  const lists = searchCards.filter((card) => card.type === 'list');
  const shops = searchCards.filter((card) => card.type === 'shop');
  const myLists = searchCards.filter((card) => card.type === 'my-lists');

  let latestVersion = 0;
  const latestSearches = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const arrRaw = localStorage.getItem('omni_latestSearches') || '[]';
      const arr = JSON.parse(arrRaw) as SearchCard[];

      return arr.map((card, index) => {
        return { ...card, index: index + 1 };
      });
    } catch {
      return [];
    }
  }, [latestVersion]);

  const showJumpTo =
    [items.length, lists.length, shops.length, myLists.length].filter((x) => Boolean(x)).length > 1;

  useEffect(() => {
    if (!router.isReady) return;
    clearSearch();
    setSearch((router.query.s as string) ?? '');
  }, [router.isReady, router.query.s, isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.target && (e.target as HTMLElement).id !== 'omni-search') return;

      const cardList = searchCards.length > 0 ? searchCards : latestSearches;
      const maxIndex = cardList.length;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, maxIndex));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case 'Enter': {
          e.preventDefault();

          setFocusedIndex((current) => {
            if (current === 0) {
              const searchValue = search.trim();
              if (!searchValue) return current;

              const searchUrl = getSearchUrl(searchValue);
              setLatest({ type: 'search', query: searchValue, index: 0, url: searchUrl });
              router.push(searchUrl);
              onClose();
              return current;
            }

            const card = cardList.find((c) => c.index === current);
            if (!card) return current;

            let url = '';
            if (card.type === 'item') {
              url = `/item/${card.data.slug}`;
            } else if (card.type === 'list' || card.type === 'my-lists') {
              url = getListLink(card.data);
            } else if (card.type === 'shop') {
              url = `/restock/${slugify(card.data.name)}`;
            } else if (card.type === 'search') {
              url = card.url;
            }

            if (url) {
              setLatest(card);
              router.push(url);
              onClose();
            }

            return current;
          });
          break;
        }
        default:
          break;
      }
    },
    [isOpen, latestSearches, onClose, router, search, searchCards]
  );

  useEffect(() => {
    document.getElementById(`omni-search-el-${focusedIndex}`)?.scrollIntoView({
      behavior: 'smooth',
      block: focusedIndex === 0 || focusedIndex === searchCards.length ? 'center' : 'nearest',
    });
  }, [focusedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isOpen]);

  const clearSearch = () => {
    setSearch('');
    setFocusedIndex(0);
    setSearchCards([]);
    inputRef.current?.focus();
  };

  const debouncedPreSearch = useMemo(
    () =>
      debounce((value) => {
        preSearch(value);
      }, 500),
    []
  );

  const preSearch = async (newSearch: string) => {
    if (newSearch.trim().length < 3) {
      setSearchCards([]);
      setFocusedIndex(0);
      return;
    }
    setLoading(true);
    // if (!isOpen) onToggle();

    try {
      setFocusedIndex(0);
      // cancel any ongoing search request
      ABORT_CONTROLLER.abort();
      ABORT_CONTROLLER = new AbortController();
      const searchRes = await axios.get('/api/v1/search/omni', {
        signal: ABORT_CONTROLLER.signal,
        params: {
          s: newSearch.trim(),
          limit: 5,
        },
      });

      const result = searchRes.data as SearchResult;

      let i = 1;

      const cards: SearchCard[] = [
        ...result.items.map((item) => ({ index: i++, type: 'item', data: item }) as const),
        ...result.officialLists.map((list) => ({ index: i++, type: 'list', data: list }) as const),
        ...result.userLists.map((list) => ({ index: i++, type: 'my-lists', data: list }) as const),
        ...result.restockShop.map((shop) => ({ index: i++, type: 'shop', data: shop }) as const),
      ];

      setSearchCards(cards);
    } catch (e) {
      if (!axios.isCancel(e)) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);

    setSearchCards([]);
    setFocusedIndex(0);

    debouncedPreSearch.cancel();

    if (newValue.trim().length < 3) {
      setLoading(false);
      return;
    }

    setLoading(true);
    debouncedPreSearch(newValue);
  };

  const jumpToType = (type: SearchCard['type']) => {
    const card = searchCards.find((c) => c.type === type);
    if (card) {
      setFocusedIndex(card.index);
      inputRef.current?.focus();
    }
  };

  const setLatest = (card: SearchCard) => {
    if (card.type === 'search' && card.query.trim().length === 0) return;
    try {
      const arrRaw = localStorage.getItem('omni_latestSearches') || '[]';
      const arr = JSON.parse(arrRaw) as SearchCard[];

      //check for duplicates
      const duplicateIndex = arr.findIndex((c) => {
        if (c.type !== card.type) return false;
        if (c.type === 'item' && card.type === 'item') {
          return c.data.internal_id === card.data.internal_id;
        }
        if (
          (c.type === 'list' && card.type === 'list') ||
          (c.type === 'my-lists' && card.type === 'my-lists')
        ) {
          return c.data.internal_id === card.data.internal_id;
        }
        if (c.type === 'shop' && card.type === 'shop') {
          return c.data.id === card.data.id;
        }
        if (c.type === 'search' && card.type === 'search') {
          return c.query === card.query;
        }
        return false;
      });

      if (duplicateIndex !== -1) {
        arr.splice(duplicateIndex, 1);
      }

      while (arr.length >= 5) arr.pop();

      arr.unshift(card);

      localStorage.setItem('omni_latestSearches', JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to set latest search', e);
      localStorage.removeItem('omni_latestSearches');
    } finally {
      latestVersion++;
    }
  };

  const handleClick = (card: SearchCard) => {
    setLatest(card);

    if (window?.umami) {
      window.umami?.track('omni-search', {
        type: !searchCards.length ? 'latest-' + card.type : card.type,
      });
    }

    onClose();
  };

  const getSearchUrl = (searchQuery?: string) => {
    searchQuery = searchQuery || search;

    const queryStrings = queryString.parse(router.asPath.split('?')[1] || '', {
      arrayFormat: 'bracket',
    });

    const queryFilters = getFiltersDiff(queryStrings);

    const [filters, query] = parseFilters(searchQuery);

    const params = getFiltersDiff(filters);

    let paramsString = queryString.stringify(
      { ...queryFilters, ...params },
      {
        arrayFormat: 'bracket',
      }
    );

    paramsString = paramsString ? '&' + paramsString : '';

    return `/search?s=${encodeURIComponent(query)}${paramsString}`;
  };

  return (
    <Modal
      size={{ base: 'full', md: '2xl' }}
      isOpen={isOpen}
      onClose={onClose}
      returnFocusOnClose={false}
    >
      <ModalOverlay />
      <ModalContent>
        <InputGroup outline={'none'} border={'none !important'}>
          <InputLeftElement pointerEvents="none" h="100%">
            <InputLeftElement
              pointerEvents="none"
              children={
                <Icon as={IoSearchOutline} color="gray.500" boxSize={'24px'} aria-hidden="true" />
              }
              h="100%"
            />
            <VisuallyHidden as="label" htmlFor="omni-search" id="omni-search-label">
              {t('Search.search')}
            </VisuallyHidden>
          </InputLeftElement>
          <Input
            ref={inputRef}
            autoComplete="off"
            id="omni-search"
            variant="filled"
            placeholder={t('Search.omni-placeholder')}
            size="lg"
            bg="blackAlpha.600"
            borderBottomRadius={'none'}
            pl="40px"
            onChange={handleSearchChange}
            value={search}
            fontSize={{ base: 'sm', lg: 'md' }}
            border={'none !important'}
            _hover={{ bg: 'blackAlpha.600' }}
            _focus={{
              bg: 'blackAlpha.600',
              outline: 'none',
              border: 'none',
            }}
          />
          <InputRightElement h="100%" w="auto">
            <Button size="xs" variant={'ghost'} onClick={clearSearch}>
              {t('General.clear')}
            </Button>
            <CloseButton onClick={onClose} />
          </InputRightElement>
        </InputGroup>
        <ModalBody px="10px" maxH={{ base: '100%', md: '500px' }} overflowY="auto">
          {search && (
            <Flex flexFlow="column" gap={4} py={2}>
              <Flex role="listbox" aria-labelledby="omni-search-label">
                <SearchQuery
                  query={search}
                  index={0}
                  isFocus={focusedIndex === 0}
                  url={getSearchUrl()}
                  onClick={() =>
                    handleClick({
                      type: 'search',
                      query: search,
                      index: 0,
                      url: getSearchUrl(search),
                    })
                  }
                />
              </Flex>
            </Flex>
          )}
          {!loading && searchCards.length === 0 && latestSearches.length > 0 && (
            <Flex flexFlow="column" gap={4} py={2}>
              <Heading fontSize={'sm'} color="whiteAlpha.700">
                {t('Search.recent-searches')}
              </Heading>
              <Flex role="listbox" aria-labelledby="omni-search-label" flexFlow={'column'} gap={2}>
                {latestSearches.map((card, index) => {
                  if (card.type === 'item') {
                    return (
                      <SearchItem
                        showLabel
                        key={index}
                        index={index + 1}
                        item={card.data}
                        isFocus={focusedIndex === index + 1}
                        onClick={() => handleClick(card)}
                      />
                    );
                  }
                  if (card.type === 'list' || card.type === 'my-lists') {
                    return (
                      <SearchList
                        showLabel
                        key={index}
                        index={index + 1}
                        isFocus={focusedIndex === index + 1}
                        list={card.data}
                        onClick={() => handleClick(card)}
                      />
                    );
                  }
                  if (card.type === 'shop') {
                    return (
                      <SearchShop
                        showLabel
                        key={index}
                        index={index + 1}
                        isFocus={focusedIndex === index + 1}
                        shop={card.data}
                        onClick={() => handleClick(card)}
                      />
                    );
                  }
                  if (card.type === 'search') {
                    return (
                      <SearchQuery
                        key={index}
                        index={index + 1}
                        isFocus={focusedIndex === index + 1}
                        url={card.url}
                        query={card.query}
                        onClick={() => handleClick(card)}
                      />
                    );
                  }
                })}
              </Flex>
            </Flex>
          )}

          <Flex flexFlow="column" gap={4} py={2}>
            {loading && <SearchSkeleton />}
            {!loading && (
              <>
                {showJumpTo && (
                  <HStack>
                    <Text fontSize={'xs'} color="whiteAlpha.500">
                      {t('Search.jump-to')}
                    </Text>
                    {items.length > 0 && (
                      <Button
                        size="xs"
                        variant={'ghost'}
                        colorScheme="blue"
                        onClick={() => jumpToType('item')}
                      >
                        {t('General.items')}
                      </Button>
                    )}
                    {lists.length > 0 && (
                      <Button
                        size="xs"
                        variant={'ghost'}
                        colorScheme="green"
                        onClick={() => jumpToType('list')}
                      >
                        {t('General.official-lists')}
                      </Button>
                    )}
                    {shops.length > 0 && (
                      <Button
                        size="xs"
                        variant={'ghost'}
                        colorScheme="purple"
                        onClick={() => jumpToType('shop')}
                      >
                        {t('General.restock-shops')}
                      </Button>
                    )}
                    {myLists.length > 0 && (
                      <Button
                        size="xs"
                        variant={'ghost'}
                        colorScheme="orange"
                        onClick={() => jumpToType('my-lists')}
                      >
                        {t('Layout.my-lists')}
                      </Button>
                    )}
                  </HStack>
                )}
                {searchCards.filter((card) => card.type === 'item').length > 0 && (
                  <Flex as="section" flexFlow={'column'} gap={2}>
                    <Heading fontSize={'sm'} color="whiteAlpha.700">
                      {t('General.items')}
                    </Heading>
                    <Flex
                      flexFlow={'column'}
                      gap={2}
                      role="listbox"
                      aria-labelledby="omni-search-label"
                    >
                      {searchCards
                        .filter((card) => card.type === 'item')
                        .map((card) => (
                          <SearchItem
                            index={card.index}
                            isFocus={focusedIndex === card.index}
                            key={card.data.internal_id}
                            item={card.data}
                            onClick={() => handleClick(card)}
                          />
                        ))}
                    </Flex>
                  </Flex>
                )}
                {lists.length > 0 && (
                  <Flex as="section" flexFlow={'column'} gap={2}>
                    <Heading fontSize={'sm'} color="whiteAlpha.700">
                      {t('General.official-lists')}
                    </Heading>
                    <Flex
                      flexFlow={'column'}
                      gap={2}
                      role="listbox"
                      aria-labelledby="omni-search-label"
                    >
                      {lists.map((card) => (
                        <SearchList
                          index={card.index}
                          isFocus={focusedIndex === card.index}
                          key={card.data.internal_id}
                          list={card.data}
                          onClick={() => handleClick(card)}
                        />
                      ))}
                    </Flex>
                  </Flex>
                )}
                {shops.length > 0 && (
                  <Flex as="section" flexFlow={'column'} gap={2}>
                    <Heading fontSize={'sm'} color="whiteAlpha.700">
                      {t('General.restock-shops')}
                    </Heading>
                    <Flex
                      flexFlow={'column'}
                      gap={2}
                      role="listbox"
                      aria-labelledby="omni-search-label"
                    >
                      {shops.map((card) => (
                        <SearchShop
                          index={card.index}
                          isFocus={focusedIndex === card.index}
                          key={card.data.id}
                          shop={card.data}
                          onClick={() => handleClick(card)}
                        />
                      ))}
                    </Flex>
                  </Flex>
                )}
                {myLists.length > 0 && (
                  <Flex as="section" flexFlow={'column'} gap={2}>
                    <Heading fontSize={'sm'} color="whiteAlpha.700">
                      {t('Layout.my-lists')}
                    </Heading>
                    <Flex
                      flexFlow={'column'}
                      gap={2}
                      role="listbox"
                      aria-labelledby="omni-search-label"
                    >
                      {myLists.map((card) => (
                        <SearchList
                          index={card.index}
                          isFocus={focusedIndex === card.index}
                          key={card.data.internal_id}
                          list={card.data}
                          onClick={() => handleClick(card)}
                        />
                      ))}
                    </Flex>
                  </Flex>
                )}
              </>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter
          display={{ base: 'none', md: 'flex' }}
          bg="blackAlpha.600"
          py={3}
          justifyContent={'flex-start'}
          px="10px"
        >
          <Flex gap={4} color="whiteAlpha.700">
            <Flex alignItems={'center'} gap={1}>
              <Kbd>
                <MdArrowUpward />
              </Kbd>
              <Kbd>
                <MdArrowDownward />
              </Kbd>
              <Text fontSize={'xs'}>{t('Search.navigate')}</Text>
            </Flex>
            <Flex alignItems={'center'} gap={1}>
              <Kbd>
                <MdOutlineKeyboardReturn />
              </Kbd>
              <Text fontSize={'xs'}>{t('Search.select')}</Text>
            </Flex>
            <Flex alignItems={'center'} gap={1}>
              <Kbd>esc</Kbd>
              <Text fontSize={'xs'}>{t('General.close')}</Text>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SearchItem = ({
  item,
  isFocus,
  index,
  onClick,
  showLabel,
}: {
  item: ItemData;
  isFocus: boolean;
  index: number;
  onClick: () => void;
  showLabel?: boolean;
}) => {
  const t = useTranslations();
  return (
    <>
      <ItemCtxMenu
        menuId={`omni-search-${item.internal_id}`}
        item={item}
        // onShow={() => (disableListener = true)}
        // onHide={() => (disableListener = false)}
      />
      <CtxTrigger
        id={`omni-search-${item.internal_id}`}
        //@ts-ignore
        disableWhileShiftPressed
        // disable={isMobile ? true : undefined}
      >
        <Flex
          flex="1"
          bg={isFocus ? 'whiteAlpha.400' : 'whiteAlpha.200'}
          px={3}
          py={2}
          borderRadius={'sm'}
          alignItems="center"
          id={`omni-search-el-${index}`}
          aria-selected={isFocus}
          role="option"
          gap={3}
          _hover={{ bg: 'whiteAlpha.400' }}
        >
          <Link
            href={`/item/${item.slug}`}
            prefetch={false}
            aria-hidden
            tabIndex={-1}
            onClick={onClick}
          >
            <Image
              src={item.image}
              alt=""
              width={'30px'}
              height={'30px'}
              borderRadius={'md'}
              objectFit={'contain'}
              aria-hidden
            />
          </Link>
          <Link href={`/item/${item.slug}`} prefetch={false} onClick={onClick}>
            <VStack alignItems={'flex-start'} gap={0}>
              {showLabel && (
                <Text fontSize="xs" color="whiteAlpha.600">
                  {t('General.item')}
                </Text>
              )}
              <HStack alignItems={'baseline'} gap={2}>
                <Text fontSize="sm" color="whiteAlpha.900">
                  {item.name}
                </Text>
                <ItemCardBadge item={item} />
              </HStack>
            </VStack>
          </Link>
        </Flex>
      </CtxTrigger>
    </>
  );
};

const SearchList = ({
  list,
  isFocus,
  index,
  onClick,
  showLabel,
}: {
  list: UserList;
  isFocus: boolean;
  index: number;
  onClick: () => void;
  showLabel?: boolean;
}) => {
  const t = useTranslations();
  return (
    <Flex
      flex="1"
      bg={isFocus ? 'whiteAlpha.400' : 'whiteAlpha.200'}
      px={3}
      py={2}
      borderRadius={'sm'}
      alignItems="center"
      gap={3}
      id={`omni-search-el-${index}`}
      role="option"
      aria-selected={isFocus}
      _hover={{ bg: 'whiteAlpha.400' }}
    >
      <Link href={getListLink(list)} prefetch={false} aria-hidden tabIndex={-1} onClick={onClick}>
        <Image
          src={list.coverURL || 'https://itemdb.com.br/logo_icon.svg'}
          alt=""
          width={'30px'}
          height={'30px'}
          borderRadius={'md'}
          aria-hidden
          objectFit={'cover'}
        />
      </Link>
      <Link href={getListLink(list)} prefetch={false} onClick={onClick}>
        <VStack alignItems={'flex-start'} gap={0}>
          {showLabel && (
            <Text fontSize="xs" color="whiteAlpha.600">
              {t('Lists.List')}
            </Text>
          )}
          <Text fontSize="sm" color="whiteAlpha.900">
            {list.name}
          </Text>
        </VStack>
      </Link>
    </Flex>
  );
};

const SearchShop = ({
  shop,
  isFocus,
  index,
  onClick,
  showLabel,
}: {
  shop: ShopInfo;
  isFocus: boolean;
  index: number;
  onClick: () => void;
  showLabel?: boolean;
}) => {
  const t = useTranslations();
  return (
    <Flex
      flex="1"
      bg={isFocus ? 'whiteAlpha.400' : 'whiteAlpha.200'}
      px={3}
      py={2}
      borderRadius={'sm'}
      alignItems="center"
      gap={3}
      id={`omni-search-el-${index}`}
      role="option"
      aria-selected={isFocus}
      _hover={{ bg: 'whiteAlpha.400' }}
    >
      <Link
        href={`/restock/${slugify(shop.name)}`}
        prefetch={false}
        aria-hidden
        tabIndex={-1}
        onClick={onClick}
      >
        <Image
          src={'https://images.neopets.com/themes/h5/basic/images/v3/shop-icon.svg'}
          alt=""
          width={'30px'}
          height={'30px'}
          borderRadius={'full'}
          aria-hidden
        />
      </Link>
      <Link href={`/restock/${slugify(shop.name)}`} prefetch={false} onClick={onClick}>
        <VStack alignItems={'flex-start'} gap={0}>
          {showLabel && (
            <Text fontSize="xs" color="whiteAlpha.600">
              {t('General.restock-shop')}
            </Text>
          )}
          <Text fontSize="sm" color="whiteAlpha.900">
            {shop.name}
          </Text>
        </VStack>
      </Link>
    </Flex>
  );
};

const SearchQuery = ({
  query,
  isFocus,
  index,
  url,
  onClick,
}: {
  query: string;
  isFocus: boolean;
  index: number;
  url: string;
  onClick: () => void;
}) => {
  const t = useTranslations();
  return (
    <Flex
      as={Link}
      href={url}
      bg={isFocus ? 'whiteAlpha.400' : 'whiteAlpha.200'}
      _hover={{ bg: 'whiteAlpha.400' }}
      flex="1"
      px={3}
      py={2}
      borderRadius={'sm'}
      alignItems="center"
      gap={3}
      id={`omni-search-el-${index}`}
      role="option"
      aria-selected={isFocus}
      onClick={onClick}
    >
      <Box w="30px" display={'flex'} alignItems="center" justifyContent={'center'}>
        <Icon as={GrSearchAdvanced} boxSize={'20px'} />
      </Box>
      <VStack alignItems={'flex-start'} gap={0}>
        <Text fontSize="xs" color="whiteAlpha.600">
          {t('Layout.advanced-search')}
        </Text>
        <Text>{query}</Text>
      </VStack>
    </Flex>
  );
};

const SearchSkeleton = () => {
  return (
    <Flex as="section" flexFlow={'column'} gap={2}>
      <SkeletonText w="70px" noOfLines={1} skeletonHeight="3" />
      <Flex flexFlow={'column'} gap={2}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height="40px" borderRadius={'sm'} />
        ))}
      </Flex>
    </Flex>
  );
};
