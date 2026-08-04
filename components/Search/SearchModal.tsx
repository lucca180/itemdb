'use client';

import {
  Button,
  Input,
  InputGroup,
  CloseButton,
  Text,
  Flex,
  Kbd,
  Icon,
  Box,
  useMediaQuery,
} from '@chakra-ui/react';
import { FastModal } from '@components/ui/fast-modal';
import axios from 'axios';
import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isMobile, isFullscreen] = useMediaQuery(['(hover: none)', '(max-width: 61.99em)'], {
    fallback: [false, false],
  });
  // Defer heavy results UI only on the first open (INP); keep mounted afterward.
  const [showContent, setShowContent] = useState(false);

  // Reset modal state from the header query when it opens.
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      return;
    }

    setSearch(initialQuery);
    focusedIndexRef.current = 0;
    setSearchCards([]);
    setLoading(false);
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen || showContent) return;
    const raf = requestAnimationFrame(() => setShowContent(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen, showContent]);

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

  const deferredSearch = useDeferredValue(search);
  const liveSearchUrl = useMemo(
    () => buildSearchUrl(deferredSearch),
    [buildSearchUrl, deferredSearch]
  );

  const preSearch = async (newSearch: string) => {
    if (newSearch.trim().length < 3) {
      setSearchCards([]);
      focusedIndexRef.current = 0;
      return;
    }
    setLoading(true);

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const searchRes = await axios.get('/api/v1/search/omni', {
        signal: controller.signal,
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
      }, 300),
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
    <FastModal
      open={isOpen}
      onClose={onClose}
      initialFocusRef={inputRef}
      compensateScrollbar={!isFullscreen}
      aria-labelledby="omni-search-label"
    >
      <InputGroup
        outline="none"
        border="none !important"
        startElement={<Icon as={IoSearchOutline} color="gray.500" boxSize="24px" aria-hidden />}
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
      <FastModal.Body>
        {showContent ? (
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
            isMobile={isMobile}
          />
        ) : (
          isOpen && <SearchModalBodySkeleton />
        )}
      </FastModal.Body>
      <FastModal.Footer>
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
      </FastModal.Footer>
    </FastModal>
  );
};

export default SearchModal;
