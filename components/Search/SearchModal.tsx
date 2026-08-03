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
  Icon,
  Portal,
  Box,
  useMediaQuery,
} from '@chakra-ui/react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/compat/router';
import { IoSearchOutline } from 'react-icons/io5';
import { MdArrowDownward, MdArrowUpward, MdOutlineKeyboardReturn } from 'react-icons/md';
import queryString from 'query-string';
import { getFiltersDiff, parseFilters } from '@utils/parseFilters';
import { useTranslations } from 'next-intl';
import type { ItemData, UserList, ShopInfo } from '@types';
import type { SearchCard } from '@components/Search/SearchModalContent';

const SearchModalContent = dynamic(() => import('@components/Search/SearchModalContent'), {
  loading: () => <SearchModalBodySkeleton />,
  ssr: false,
});

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
  initialQuery?: string;
};

const SearchModalBodySkeleton = () => (
  <Flex as="section" flexFlow="column" gap={2} py={2}>
    <Box w="70px" h="14px" bg="whiteAlpha.200" borderRadius="sm" />
    <Flex flexFlow="column" gap={2}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Box key={index} h="40px" borderRadius="sm" bg="whiteAlpha.200" />
      ))}
    </Flex>
  </Flex>
);

const SearchModal = (props: SearchModalProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { isOpen, onClose, initialQuery = '' } = props;
  const [search, setSearch] = useState<string>('');
  const [searchCards, setSearchCards] = useState<SearchCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedIndexRef = useRef(0);
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });

  // Reset modal state from the header query when it opens.
  useEffect(() => {
    if (!isOpen) return;

    setSearch(initialQuery);
    focusedIndexRef.current = 0;
    setSearchCards([]);
    setLoading(false);
  }, [isOpen, initialQuery]);

  const buildSearchUrl = useCallback(
    (searchQuery: string) => {
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

      return `/search?s=${encodeURIComponent(query)}${paramsString}`;
    },
    [router?.asPath]
  );

  const liveSearchUrl = useMemo(() => buildSearchUrl(search), [buildSearchUrl, search]);

  const preSearch = async (newSearch: string) => {
    if (newSearch.trim().length < 3) {
      setSearchCards([]);
      focusedIndexRef.current = 0;
      return;
    }
    setLoading(true);

    try {
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

  const debouncedPreSearch = useMemo(
    () =>
      debounce((value: string) => {
        void preSearch(value);
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedPreSearch.cancel();
    };
  }, [debouncedPreSearch]);

  const clearSearch = () => {
    setSearch('');
    focusedIndexRef.current = 0;
    setSearchCards([]);
    setLoading(false);
    debouncedPreSearch.cancel();
    inputRef.current?.focus();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    focusedIndexRef.current = 0;

    debouncedPreSearch.cancel();

    if (newValue.trim().length < 3) {
      setSearchCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debouncedPreSearch(newValue);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="top"
      size={{ lgDown: 'full', lg: 'lg' }}
      motionPreset={isMobile ? 'none' : 'scale'}
      trapFocus={!isMobile}
      preventScroll={!isMobile}
      restoreFocus={false}
      unmountOnExit={false}
      skipAnimationOnMount
      lazyMount={false}
      initialFocusEl={() => inputRef.current}
      immediate
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius={{ base: 0, md: 'md' }} p={0} overflow="hidden">
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
              {isOpen && (
                <SearchModalContent
                  isOpen={isOpen}
                  search={search}
                  searchCards={searchCards}
                  loading={loading}
                  liveSearchUrl={liveSearchUrl}
                  buildSearchUrl={buildSearchUrl}
                  onClose={onClose}
                  inputRef={inputRef}
                  focusedIndexRef={focusedIndexRef}
                />
              )}
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
