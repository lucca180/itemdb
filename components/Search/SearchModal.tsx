'use client';

import {
  Dialog,
  Button,
  Input,
  InputGroup,
  CloseButton,
  Text,
  Flex,
  Kbd,
  Heading,
  VStack,
  Image,
  Box,
  HStack,
  Icon,
  SkeletonText,
  Skeleton,
  Portal,
  Link as ChakraLink,
  useMediaQuery,
} from '@chakra-ui/react';
import { ItemCardBadge } from '@components/Items/ItemCardBadge';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';
import { getListLink } from '@utils/list/listLink';
import { ItemData, UserList, ShopInfo } from '@types';
import { slugify } from '@utils/utils';
import axios from 'axios';
import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';
import { Link } from '@i18n/navigation';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { useRouter } from 'next/compat/router';
import { GrSearchAdvanced } from 'react-icons/gr';
import { IoSearchOutline } from 'react-icons/io5';
import { MdArrowDownward, MdArrowUpward, MdOutlineKeyboardReturn } from 'react-icons/md';
import queryString from 'query-string';
import { getFiltersDiff, parseFilters } from '@utils/parseFilters';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedHref, type AppLocale } from '@utils/locales';

const ItemCtxMenu = dynamic(() => import('@components/Menus/ItemCtxMenu'), { ssr: false });

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

const SearchModal = (props: SearchModalProps) => {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  // null on App Router; Pages Router exposes query/asPath for navigation.
  const router = useRouter();
  const { isOpen, onClose } = props;
  const [search, setSearch] = useState<string>('');
  const [searchCards, setSearchCards] = useState<SearchCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedIndexRef = useRef(0);

  const { items, lists, shops, myLists } = useMemo(() => {
    const next = {
      items: [] as Extract<SearchCard, { type: 'item' }>[],
      lists: [] as Extract<SearchCard, { type: 'list' }>[],
      shops: [] as Extract<SearchCard, { type: 'shop' }>[],
      myLists: [] as Extract<SearchCard, { type: 'my-lists' }>[],
    };
    for (const card of searchCards) {
      if (card.type === 'item') next.items.push(card);
      else if (card.type === 'list') next.lists.push(card);
      else if (card.type === 'shop') next.shops.push(card);
      else if (card.type === 'my-lists') next.myLists.push(card);
    }
    return next;
  }, [searchCards]);

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

  const applyFocusDom = useCallback((index: number, opts?: { scroll?: boolean }) => {
    const prev = focusedIndexRef.current;
    if (prev !== index) {
      document.getElementById(`omni-search-el-${prev}`)?.setAttribute('aria-selected', 'false');
    }
    focusedIndexRef.current = index;
    const el = document.getElementById(`omni-search-el-${index}`);
    if (!el) return;
    el.setAttribute('aria-selected', 'true');
    if (opts?.scroll !== false) {
      el.scrollIntoView({
        behavior: 'auto',
        block: index === 0 ? 'center' : 'nearest',
      });
    }
  }, []);

  // Seed the modal input from the current URL when it opens (single state wave).
  useEffect(() => {
    if (!isOpen) return;

    const seeded = router?.isReady
      ? ((router.query.s as string) ?? '')
      : typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('s') ?? '')
        : '';

    setSearch(seeded);
    focusedIndexRef.current = 0;
    setSearchCards([]);
    setLoading(false);
  }, [isOpen, router?.isReady, router?.query.s]);

  // Re-apply focus highlight after list remounts (without React re-render of all rows).
  useLayoutEffect(() => {
    if (!isOpen) return;
    applyFocusDom(focusedIndexRef.current, { scroll: false });
  }, [isOpen, searchCards, search, loading, latestSearches, applyFocusDom]);

  const buildSearchUrl = useCallback(
    (searchQuery: string) => {
      // Preserve active search filters from the page the user is on.
      const currentPath =
        router?.asPath ??
        (typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '');
      const queryStrings = queryString.parse(currentPath.split('?')[1] || '', {
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

      const url = `/search?s=${encodeURIComponent(query)}${paramsString}`;
      return url;
    },
    [router?.asPath]
  );

  const liveSearchUrl = useMemo(() => buildSearchUrl(search), [buildSearchUrl, search]);

  const navigate = useCallback(
    (url: string) => {
      const href = getLocalizedHref(url, locale);
      if (router) return router.push(href);
      window.location.assign(href);
    },
    [locale, router]
  );

  const track = useCallback((event: string, type?: string) => {
    const run = () => {
      window.umami?.track(event, { type });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(run);
      return;
    }

    setTimeout(run, 0);
  }, []);

  const setLatest = useCallback((card: SearchCard) => {
    if (card.type === 'search' && card.query.trim().length === 0) return;
    try {
      const arrRaw = localStorage.getItem('omni_latestSearches') || '[]';
      const arr = JSON.parse(arrRaw) as SearchCard[];

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
  }, []);

  const navStateRef = useRef({
    search,
    searchCards,
    latestSearches,
    buildSearchUrl,
    navigate,
    setLatest,
    onClose,
    track,
  });
  navStateRef.current = {
    search,
    searchCards,
    latestSearches,
    buildSearchUrl,
    navigate,
    setLatest,
    onClose,
    track,
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).id !== 'omni-search') return;
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;

      const {
        search: searchValue,
        searchCards: cards,
        latestSearches: recent,
        buildSearchUrl: toUrl,
        navigate: go,
        setLatest: saveLatest,
        onClose: close,
        track: trackEvent,
      } = navStateRef.current;

      const cardList = cards.length > 0 ? cards : recent;
      const maxIndex = cardList.length;
      const focusedIndex = focusedIndexRef.current;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          applyFocusDom(Math.min(focusedIndex + 1, maxIndex));
          trackEvent('omni-navigate', 'down');
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          applyFocusDom(Math.max(focusedIndex - 1, 0));
          trackEvent('omni-navigate', 'up');
          break;
        }
        case 'Enter': {
          e.preventDefault();
          trackEvent('omni-navigate', 'enter');

          if (focusedIndex === 0) {
            const q = searchValue.trim();
            if (q) {
              const searchUrl = toUrl(q);
              saveLatest({ type: 'search', query: q, index: 0, url: searchUrl });
              trackEvent('omni-search', !cards.length ? 'latest-enter-search' : 'enter-search');
              go(searchUrl);
              close();
            }
            break;
          }

          const card = cardList.find((c) => c.index === focusedIndex);
          if (!card) break;

          trackEvent(
            'omni-search',
            !cards.length ? 'latest-enter-' + card.type : 'enter-' + card.type
          );

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
            saveLatest(card);
            go(url);
            close();
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyFocusDom, isOpen]);

  const clearSearch = () => {
    setSearch('');
    focusedIndexRef.current = 0;
    setSearchCards([]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const debouncedPreSearch = useMemo(
    () =>
      debounce((value: string) => {
        preSearch(value);
      }, 500),
    []
  );

  const preSearch = async (newSearch: string) => {
    if (newSearch.trim().length < 3) {
      setSearchCards([]);
      focusedIndexRef.current = 0;
      return;
    }
    setLoading(true);

    try {
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
        ...result.restockShop.map((shop) => ({ index: i++, type: 'shop', data: shop }) as const),
        ...result.userLists.map((list) => ({ index: i++, type: 'my-lists', data: list }) as const),
      ];

      focusedIndexRef.current = 0;
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
    applyFocusDom(0, { scroll: false });

    debouncedPreSearch.cancel();

    if (newValue.trim().length < 3) {
      setSearchCards([]);
      setLoading(false);
      return;
    }

    // Keep previous cards visible while the debounced request runs (stale-while-revalidate).
    setLoading(true);
    debouncedPreSearch(newValue);
  };

  const jumpToType = (type: SearchCard['type']) => {
    const card = searchCards.find((c) => c.type === type);
    if (card) {
      applyFocusDom(card.index);
      inputRef.current?.focus();
    }

    track('omni-jump', type);
  };

  const handleClick = (card: SearchCard) => {
    setLatest(card);

    track('omni-search', !searchCards.length ? 'latest-' + card.type : card.type);

    onClose();
  };

  const handleClickRef = useRef(handleClick);
  handleClickRef.current = handleClick;

  const onSelectCard = useCallback((card: SearchCard) => {
    handleClickRef.current(card);
  }, []);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="top"
      size={{ lgDown: 'full', lg: 'lg' }}
      restoreFocus={false}
      unmountOnExit={false}
      skipAnimationOnMount
      initialFocusEl={() => inputRef.current}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            // maxW={{ md: '2xl' }}
            // w={{ base: '100vw', md: 'auto' }}
            // maxH={{ base: '100dvh', md: 'auto' }}
            // m={{ base: 0, md: 'auto' }}
            borderRadius={{ base: 0, md: 'md' }}
            p={0}
            overflow="hidden"
          >
            <InputGroup
              outline="none"
              border="none !important"
              startElement={
                <Icon as={IoSearchOutline} color="gray.500" boxSize="24px" aria-hidden />
              }
              startElementProps={{ pointerEvents: 'none', h: '100%' }}
              endElement={
                <>
                  <Button size="xs" variant="ghost" onClick={clearSearch}>
                    {t('General.clear')}
                  </Button>
                  <CloseButton onClick={onClose} />
                </>
              }
              endElementProps={{ h: '100%', w: 'auto' }}
            >
              <Input
                ref={inputRef}
                autoComplete="off"
                id="omni-search"
                variant="subtle"
                placeholder={t('Search.omni-placeholder')}
                size="lg"
                bg="blackAlpha.600"
                borderBottomRadius="none"
                pl="40px"
                onChange={handleSearchChange}
                value={search}
                fontSize={{ base: 'sm', lg: 'md' }}
                border="none !important"
                _hover={{ bg: 'blackAlpha.600' }}
                _focus={{
                  bg: 'blackAlpha.600',
                  outline: 'none',
                  border: 'none',
                }}
              />
            </InputGroup>
            <label
              htmlFor="omni-search"
              id="omni-search-label"
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0,
              }}
            >
              {t('Search.search')}
            </label>
            <Dialog.Body px="10px" maxH={{ base: '100%', md: '500px' }} overflowY="auto">
              <style>{`
                [data-omni-row][aria-selected="true"] {
                  background: rgba(255, 255, 255, 0.16) !important;
                }
              `}</style>
              {search && (
                <Flex flexFlow="column" gap={4} py={2}>
                  <Flex role="listbox" aria-labelledby="omni-search-label">
                    <SearchQuery
                      query={search}
                      index={0}
                      url={liveSearchUrl}
                      onSelect={onSelectCard}
                      selectCard={{
                        type: 'search',
                        query: search,
                        index: 0,
                        url: liveSearchUrl,
                      }}
                    />
                  </Flex>
                </Flex>
              )}
              {!loading && searchCards.length === 0 && latestSearches.length > 0 && (
                <Flex flexFlow="column" gap={4} py={2}>
                  <Heading fontSize={'sm'} color="whiteAlpha.700">
                    {t('Search.recent-searches')}
                  </Heading>
                  <Flex
                    role="listbox"
                    aria-labelledby="omni-search-label"
                    flexFlow={'column'}
                    gap={2}
                  >
                    {latestSearches.map((card, index) => {
                      if (card.type === 'item') {
                        return (
                          <SearchItem
                            showLabel
                            key={`recent-item-${card.data.internal_id}`}
                            index={index + 1}
                            item={card.data}
                            onSelect={onSelectCard}
                            selectCard={card}
                          />
                        );
                      }
                      if (card.type === 'list' || card.type === 'my-lists') {
                        return (
                          <SearchList
                            showLabel
                            key={`recent-list-${card.data.internal_id}`}
                            index={index + 1}
                            list={card.data}
                            onSelect={onSelectCard}
                            selectCard={card}
                          />
                        );
                      }
                      if (card.type === 'shop') {
                        return (
                          <SearchShop
                            showLabel
                            key={`recent-shop-${card.data.id}`}
                            index={index + 1}
                            shop={card.data}
                            onSelect={onSelectCard}
                            selectCard={card}
                          />
                        );
                      }
                      if (card.type === 'search') {
                        return (
                          <SearchQuery
                            key={`recent-search-${card.query}-${index}`}
                            index={index + 1}
                            url={card.url}
                            query={card.query}
                            onSelect={onSelectCard}
                            selectCard={card}
                          />
                        );
                      }
                    })}
                  </Flex>
                </Flex>
              )}

              <Flex
                flexFlow="column"
                gap={4}
                py={2}
                opacity={loading && searchCards.length > 0 ? 0.55 : 1}
                aria-busy={loading || undefined}
                transition="opacity 0.15s ease"
              >
                {loading && searchCards.length === 0 && <SearchSkeleton />}
                {searchCards.length > 0 && (
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
                            colorPalette="blue"
                            onClick={() => jumpToType('item')}
                          >
                            {t('General.items')}
                          </Button>
                        )}
                        {lists.length > 0 && (
                          <Button
                            size="xs"
                            variant={'ghost'}
                            colorPalette="green"
                            onClick={() => jumpToType('list')}
                          >
                            {t('General.official-lists')}
                          </Button>
                        )}
                        {shops.length > 0 && (
                          <Button
                            size="xs"
                            variant={'ghost'}
                            colorPalette="purple"
                            onClick={() => jumpToType('shop')}
                          >
                            {t('General.restock-shops')}
                          </Button>
                        )}
                        {myLists.length > 0 && (
                          <Button
                            size="xs"
                            variant={'ghost'}
                            colorPalette="orange"
                            onClick={() => jumpToType('my-lists')}
                          >
                            {t('Layout.my-lists')}
                          </Button>
                        )}
                      </HStack>
                    )}
                    {items.length > 0 && (
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
                          {items.map((card) => (
                            <SearchItem
                              index={card.index}
                              key={card.data.internal_id}
                              item={card.data}
                              onSelect={onSelectCard}
                              selectCard={card}
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
                              key={card.data.internal_id}
                              list={card.data}
                              onSelect={onSelectCard}
                              selectCard={card}
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
                              key={card.data.id}
                              shop={card.data}
                              onSelect={onSelectCard}
                              selectCard={card}
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
                              key={card.data.internal_id}
                              list={card.data}
                              onSelect={onSelectCard}
                              selectCard={card}
                            />
                          ))}
                        </Flex>
                      </Flex>
                    )}
                  </>
                )}
              </Flex>
            </Dialog.Body>
            <Dialog.Footer
              display={{ base: 'none', md: 'flex' }}
              bg="blackAlpha.600"
              py={3}
              justifyContent="flex-start"
              px="10px"
            >
              <Flex gap={4} color="whiteAlpha.700">
                <Flex alignItems="center" gap={1}>
                  <Kbd>
                    <MdArrowUpward />
                  </Kbd>
                  <Kbd>
                    <MdArrowDownward />
                  </Kbd>
                  <Text fontSize="xs">{t('Search.navigate')}</Text>
                </Flex>
                <Flex alignItems="center" gap={1}>
                  <Kbd>
                    <MdOutlineKeyboardReturn />
                  </Kbd>
                  <Text fontSize="xs">{t('Search.select')}</Text>
                </Flex>
                <Flex alignItems="center" gap={1}>
                  <Kbd>esc</Kbd>
                  <Text fontSize="xs">{t('General.close')}</Text>
                </Flex>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default SearchModal;

const SearchItem = memo(function SearchItem({
  item,
  index,
  onSelect,
  selectCard,
  showLabel,
}: {
  item: ItemData;
  index: number;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'item' }>;
  showLabel?: boolean;
}) {
  const t = useTranslations();
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);

  const loadContextMenu = () => {
    if (isMobile || isContextMenuLoaded) return;
    void import('@components/Menus/ItemCtxMenu');
    setIsContextMenuLoaded(true);
  };
  const loadContextMenuOnRightClick = (event: MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  const row = (
    <ChakraLink asChild w="100%" _hover={{ textDecoration: 'none' }}>
      <Link href={`/item/${item.slug}`} prefetch={false} onClick={() => onSelect(selectCard)}>
        <Flex
          data-omni-row
          flex="1"
          bg="whiteAlpha.200"
          px={3}
          py={2}
          borderRadius={'sm'}
          alignItems="center"
          id={`omni-search-el-${index}`}
          aria-selected="false"
          role="option"
          gap={3}
          _hover={{ bg: 'whiteAlpha.400' }}
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
              <ItemCardBadge item={item} interactive={false} />
            </HStack>
          </VStack>
        </Flex>
      </Link>
    </ChakraLink>
  );

  if (isMobile) return row;

  return (
    <>
      {isContextMenuLoaded && (
        <ItemCtxMenu menuId={`omni-search-${item.internal_id}`} item={item} />
      )}
      <CtxTrigger
        id={`omni-search-${item.internal_id}`}
        //@ts-ignore
        disableWhileShiftPressed
        attributes={{
          onPointerEnter: loadContextMenu,
          onMouseDown: loadContextMenuOnRightClick,
        }}
      >
        {row}
      </CtxTrigger>
    </>
  );
});

const SearchList = memo(function SearchList({
  list,
  index,
  onSelect,
  selectCard,
  showLabel,
}: {
  list: UserList;
  index: number;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'list' | 'my-lists' }>;
  showLabel?: boolean;
}) {
  const t = useTranslations();
  const href = getListLink(list);
  return (
    <ChakraLink asChild w="100%" _hover={{ textDecoration: 'none' }}>
      <Link href={href} prefetch={false} onClick={() => onSelect(selectCard)}>
        <Flex
          data-omni-row
          flex="1"
          bg="whiteAlpha.200"
          px={3}
          py={2}
          borderRadius={'sm'}
          alignItems="center"
          gap={3}
          id={`omni-search-el-${index}`}
          role="option"
          aria-selected="false"
          _hover={{ bg: 'whiteAlpha.400' }}
        >
          <Image
            src={list.coverURL || 'https://itemdb.com.br/logo_icon.svg'}
            alt=""
            width={'30px'}
            height={'30px'}
            borderRadius={'md'}
            aria-hidden
            objectFit={'cover'}
          />
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
        </Flex>
      </Link>
    </ChakraLink>
  );
});

const SearchShop = memo(function SearchShop({
  shop,
  index,
  onSelect,
  selectCard,
  showLabel,
}: {
  shop: ShopInfo;
  index: number;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'shop' }>;
  showLabel?: boolean;
}) {
  const t = useTranslations();
  const href = `/restock/${slugify(shop.name)}`;
  return (
    <ChakraLink asChild w="100%" _hover={{ textDecoration: 'none' }}>
      <Link href={href} prefetch={false} onClick={() => onSelect(selectCard)}>
        <Flex
          data-omni-row
          flex="1"
          bg="whiteAlpha.200"
          px={3}
          py={2}
          borderRadius={'sm'}
          alignItems="center"
          gap={3}
          id={`omni-search-el-${index}`}
          role="option"
          aria-selected="false"
          _hover={{ bg: 'whiteAlpha.400' }}
        >
          <Image
            src={'https://images.neopets.com/themes/h5/basic/images/v3/shop-icon.svg'}
            alt=""
            width={'30px'}
            height={'30px'}
            borderRadius={'full'}
            aria-hidden
          />
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
        </Flex>
      </Link>
    </ChakraLink>
  );
});

const SearchQuery = memo(function SearchQuery({
  query,
  index,
  url,
  onSelect,
  selectCard,
}: {
  query: string;
  index: number;
  url: string;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'search' }>;
}) {
  const t = useTranslations();
  return (
    <ChakraLink asChild w="100%" _hover={{ textDecoration: 'none' }}>
      {/* url is an internal path; Link applies the locale prefix */}
      <Link href={url} prefetch={false} onClick={() => onSelect(selectCard)}>
        <Flex
          data-omni-row
          bg="whiteAlpha.200"
          _hover={{ bg: 'whiteAlpha.400' }}
          flex="1"
          px={3}
          py={2}
          borderRadius="sm"
          alignItems="center"
          gap={3}
          id={`omni-search-el-${index}`}
          role="option"
          aria-selected="false"
        >
          <Box w="30px" display="flex" alignItems="center" justifyContent="center">
            <Icon as={GrSearchAdvanced} boxSize="20px" />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="xs" color="whiteAlpha.600">
              {t('Layout.advanced-search')}
            </Text>
            <Text>{query}</Text>
          </VStack>
        </Flex>
      </Link>
    </ChakraLink>
  );
});

const SearchSkeleton = () => {
  return (
    <Flex as="section" flexFlow={'column'} gap={2}>
      <SkeletonText w="70px" noOfLines={1} bg="whiteAlpha.200" />
      <Flex flexFlow={'column'} gap={2}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height="40px" borderRadius={'sm'} bg="whiteAlpha.200" />
        ))}
      </Flex>
    </Flex>
  );
};
