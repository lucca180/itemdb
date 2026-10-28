'use client';

import {
  Button,
  Text,
  Flex,
  Heading,
  VStack,
  Image,
  Box,
  HStack,
  Icon,
  SkeletonText,
  Skeleton,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { ItemCardBadge } from '@components/Items/ItemCardBadge';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';
import { getListLink } from '@utils/list/listLink';
import { ItemData, UserList, ShopInfo, SearchFilters } from '@types';
import { slugify } from '@utils/utils';
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
  type MutableRefObject,
  type RefObject,
} from 'react';
import { useRouter } from 'next/compat/router';
import { GrSearchAdvanced } from 'react-icons/gr';
import { IoClose } from 'react-icons/io5';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedHref, type AppLocale } from '@utils/locales';
import { countActiveFilters, defaultFilters } from '@utils/parseFilters';
import queryString from 'query-string';

const ItemCtxMenu = dynamic(() => import('@components/Menus/ItemCtxMenu'), { ssr: false });

export type SearchCard =
  | { index: number; type: 'item'; data: ItemData }
  | { index: number; type: 'list'; data: UserList }
  | { index: number; type: 'my-lists'; data: UserList }
  | { index: number; type: 'shop'; data: ShopInfo }
  | { index: number; type: 'search'; query: string; url: string };

export type SearchModalContentProps = {
  isOpen: boolean;
  search: string;
  searchCards: SearchCard[];
  loading: boolean;
  liveSearchUrl: string;
  buildSearchUrl: (searchQuery: string) => string;
  /** Filters and sort the new query inherits from the current search URL. */
  inheritedFilters: Partial<SearchFilters>;
  /** Name of the list the current search is scoped to, if any. */
  listName?: string;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  focusedIndexRef: MutableRefObject<number>;
  isMobile: boolean;
};

const SearchModalContent = (props: SearchModalContentProps) => {
  const {
    isOpen,
    search,
    searchCards,
    loading,
    buildSearchUrl,
    inheritedFilters,
    listName,
    onClose,
    inputRef,
    focusedIndexRef,
    isMobile,
  } = props;
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [latestVersion, setLatestVersion] = useState(0);

  // Empty when the new query carries nothing over from the current search.
  const searchHint = [
    describeSearchFilters(inheritedFilters, t),
    listName && t('Search.in-list', { name: listName }),
  ]
    .filter(Boolean)
    .join(' · ');

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

  const latestSearches = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const arrRaw = localStorage.getItem('omni_latestSearches') || '[]';
      const arr = sanitizeLatestSearches(JSON.parse(arrRaw) as SearchCard[]);

      return arr.map((card, index) => {
        return { ...card, index: index + 1 };
      });
    } catch {
      return [];
    }
  }, [latestVersion]);

  const showJumpTo =
    [items.length, lists.length, shops.length, myLists.length].filter((x) => Boolean(x)).length > 1;

  const applyFocusDom = useCallback(
    (index: number, opts?: { scroll?: boolean }) => {
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
    },
    [focusedIndexRef]
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    applyFocusDom(focusedIndexRef.current, { scroll: false });
  }, [isOpen, searchCards, search, loading, latestSearches, applyFocusDom, focusedIndexRef]);

  const navigate = useCallback(
    (url: string) => {
      const href = getLocalizedHref(url, locale);
      if (router) return router.push(href);

      // App Router: next/navigation useRouter throws on Pages (no AppRouterContext),
      // so shared chrome cannot call it. Prefer the row's next-intl <Link>.
      const rowHref = new URL(href, window.location.origin);
      if (rowHref.pathname === window.location.pathname) {
        window.history.pushState(null, '', `${rowHref.pathname}${rowHref.search}`);
        return;
      }

      window.location.assign(href);
    },
    [locale, router]
  );

  const activateOmniRow = useCallback((index: number) => {
    const row = document.getElementById(`omni-search-el-${index}`);
    const anchor = row?.closest('a');
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    anchor.click();
    return true;
  }, []);

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
      const arr = sanitizeLatestSearches(JSON.parse(arrRaw) as SearchCard[]);

      const duplicateIndex = arr.findIndex((c) => isSameCard(c, card));

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
      setLatestVersion((v) => v + 1);
    }
  }, []);

  const removeLatest = (card?: SearchCard) => {
    try {
      if (!card) localStorage.removeItem('omni_latestSearches');
      else {
        const arrRaw = localStorage.getItem('omni_latestSearches') || '[]';
        const arr = (JSON.parse(arrRaw) as SearchCard[]).filter((c) => !isSameCard(c, card));
        localStorage.setItem('omni_latestSearches', JSON.stringify(arr));
      }
    } catch (e) {
      console.error('Failed to remove latest search', e);
      localStorage.removeItem('omni_latestSearches');
    }

    // the removed row may have been the focused one; keep typing/arrows working from the input
    applyFocusDom(0, { scroll: false });
    inputRef.current?.focus();
    setLatestVersion((v) => v + 1);
    track('omni-recent', card ? 'remove-' + card.type : 'clear');
  };

  const navStateRef = useRef({
    search,
    searchCards,
    latestSearches,
    buildSearchUrl,
    navigate,
    activateOmniRow,
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
    activateOmniRow,
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
        activateOmniRow: activateRow,
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
              if (!activateRow(0)) go(searchUrl);
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
            if (!activateRow(focusedIndex)) go(url);
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
  }, [applyFocusDom, focusedIndexRef, isOpen]);

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
    <>
      <style>{`
        [data-omni-row][aria-selected="true"] {
          background: rgba(255, 255, 255, 0.16) !important;
        }
      `}</style>
      {search && (
        <Flex flexFlow="column" gap={4} py={4}>
          <Flex role="listbox" aria-labelledby="omni-search-label">
            <SearchQuery
              query={search}
              index={0}
              url={buildSearchUrl(search)}
              hint={searchHint}
              onSelect={onSelectCard}
              selectCard={{
                type: 'search',
                query: search,
                index: 0,
                url: buildSearchUrl(search),
              }}
            />
          </Flex>
        </Flex>
      )}
      {!loading && searchCards.length === 0 && latestSearches.length > 0 && (
        <Flex flexFlow="column" gap={4} py={4}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize={'sm'} color="whiteAlpha.700">
              {t('Search.recent-searches')}
            </Heading>
            <Button
              size="xs"
              variant="ghost"
              color="whiteAlpha.600"
              _hover={{ color: 'whiteAlpha.900' }}
              onClick={() => removeLatest()}
            >
              {t('Search.clear-recent')}
            </Button>
          </Flex>
          <Flex role="listbox" aria-labelledby="omni-search-label" flexFlow={'column'} gap={2}>
            {latestSearches.map((card, index) => {
              const removeButton = (
                <RemoveRecentButton
                  label={t('Search.remove-recent')}
                  onClick={() => removeLatest(card)}
                />
              );

              if (card.type === 'item') {
                return (
                  <Box
                    key={`recent-item-${card.data.internal_id}`}
                    position="relative"
                    css={RECENT_ROW_CSS}
                  >
                    <SearchItem
                      showLabel
                      index={card.index}
                      item={card.data}
                      onSelect={onSelectCard}
                      selectCard={card}
                      isMobile={isMobile}
                    />
                    {removeButton}
                  </Box>
                );
              }
              if (card.type === 'list' || card.type === 'my-lists') {
                return (
                  <Box
                    key={`recent-list-${card.data.internal_id}`}
                    position="relative"
                    css={RECENT_ROW_CSS}
                  >
                    <SearchList
                      showLabel
                      index={card.index}
                      list={card.data}
                      onSelect={onSelectCard}
                      selectCard={card}
                    />
                    {removeButton}
                  </Box>
                );
              }
              if (card.type === 'shop') {
                return (
                  <Box key={`recent-shop-${card.data.id}`} position="relative" css={RECENT_ROW_CSS}>
                    <SearchShop
                      showLabel
                      index={card.index}
                      shop={card.data}
                      onSelect={onSelectCard}
                      selectCard={card}
                    />
                    {removeButton}
                  </Box>
                );
              }
              if (card.type === 'search') {
                return (
                  <Box
                    key={`recent-search-${card.query}-${index}`}
                    position="relative"
                    css={RECENT_ROW_CSS}
                  >
                    <SearchQuery
                      index={card.index}
                      url={card.url}
                      hint={describeSearchFilters(getUrlQuery(card.url), t)}
                      query={card.query}
                      onSelect={onSelectCard}
                      selectCard={card}
                    />
                    {removeButton}
                  </Box>
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
                      isMobile={isMobile}
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
    </>
  );
};

export default SearchModalContent;

// Recent searches used to keep the page of the search they were made from (`page=5`), which
// sends a new query straight to an empty page. A query always starts on page 1.
const sanitizeLatestSearches = (cards: SearchCard[]): SearchCard[] =>
  cards.map((card) =>
    card.type === 'search'
      ? {
          ...card,
          url: card.url.replace(/([?&])page=[^&]*(&|$)/, (_, sep, next) => (next ? sep : '')),
        }
      : card
  );

const getUrlQuery = (url: string) =>
  queryString.parse(url.split('?')[1] ?? '', { arrayFormat: 'bracket' });

// "2 filters · sorted by price (descending)", or empty when there is nothing to tell. The sort
// only shows when it isn't the default (name, ascending).
const describeSearchFilters = (
  filters: { [key: string]: unknown },
  t: ReturnType<typeof useTranslations>
) => {
  const count = countActiveFilters(filters);
  const sortBy = String(filters.sortBy || defaultFilters.sortBy);
  const sortDir = String(filters.sortDir || defaultFilters.sortDir);
  const isDefaultSort = sortBy === defaultFilters.sortBy && sortDir === defaultFilters.sortDir;

  return [
    count > 0 && t('Search.x-filters', { count }),
    !isDefaultSort &&
      t('Search.sorted-by', {
        field: getSortLabel(sortBy, t),
        dir: (sortDir === 'desc' ? t('General.descending') : t('General.ascending')).toLowerCase(),
      }),
  ]
    .filter(Boolean)
    .join(' · ');
};

// Same labels as the sort select on the search page.
const getSortLabel = (sortBy: string, t: ReturnType<typeof useTranslations>) => {
  switch (sortBy) {
    case 'name':
      return t('General.name');
    case 'price':
      return t('General.price');
    case 'ncValue':
      return t('ItemPage.nc-value');
    case 'rarity':
      return t('General.rarity');
    case 'color':
      return t('General.color');
    case 'weight':
      return t('General.weight');
    case 'estVal':
      return t('General.est-val');
    case 'id':
      return t('General.id');
    default:
      return sortBy;
  }
};

const isSameCard = (a: SearchCard, b: SearchCard) => {
  if (a.type !== b.type) return false;
  if (a.type === 'item' && b.type === 'item') return a.data.internal_id === b.data.internal_id;
  if ((a.type === 'list' || a.type === 'my-lists') && (b.type === 'list' || b.type === 'my-lists'))
    return a.data.internal_id === b.data.internal_id;
  if (a.type === 'shop' && b.type === 'shop') return a.data.id === b.data.id;
  if (a.type === 'search' && b.type === 'search') return a.query === b.query;
  return false;
};

// Room on the right of a recent row for the remove button drawn over it.
const RECENT_ROW_CSS = { '& [data-omni-row]': { paddingRight: '40px' } };

// Sits inside the row's card but is a sibling of its link, so clicking it never navigates.
const RemoveRecentButton = (props: { label: string; onClick: () => void }) => (
  <IconButton
    aria-label={props.label}
    title={props.label}
    position="absolute"
    right={1.5}
    top="50%"
    transform="translateY(-50%)"
    size="xs"
    variant="ghost"
    color="whiteAlpha.500"
    _hover={{ color: 'whiteAlpha.900', bg: 'whiteAlpha.200' }}
    onClick={props.onClick}
  >
    <IoClose />
  </IconButton>
);

export const SearchSkeleton = () => {
  return (
    <Flex as="section" flexFlow={'column'} gap={2} py={2}>
      <SkeletonText w="70px" noOfLines={1} bg="whiteAlpha.200" />
      <Flex flexFlow={'column'} gap={2}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height="40px" borderRadius={'sm'} bg="whiteAlpha.200" />
        ))}
      </Flex>
    </Flex>
  );
};

const SearchItem = memo(function SearchItem({
  item,
  index,
  onSelect,
  selectCard,
  showLabel,
  isMobile,
}: {
  item: ItemData;
  index: number;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'item' }>;
  showLabel?: boolean;
  isMobile: boolean;
}) {
  const t = useTranslations();
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
  hint,
  onSelect,
  selectCard,
}: {
  query: string;
  index: number;
  url: string;
  hint?: string;
  onSelect: (card: SearchCard) => void;
  selectCard: Extract<SearchCard, { type: 'search' }>;
}) {
  const t = useTranslations();
  return (
    <ChakraLink asChild w="100%" _hover={{ textDecoration: 'none' }}>
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
              {hint && ` · ${hint}`}
            </Text>
            <Text>{query}</Text>
          </VStack>
        </Flex>
      </Link>
    </ChakraLink>
  );
});
