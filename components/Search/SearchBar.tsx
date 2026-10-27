'use client';

import { SearchIcon } from '@utils/theme/chakraIcons';
import { InputGroup, useDisclosure, Button, Flex, Kbd, Text } from '@chakra-ui/react';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isValidLocale, stripLocalePrefix } from '@utils/locales';
import SearchMenu from '../Menus/SearchMenu';

const SearchModal = dynamic(() => import('@components/Search/SearchModal'), {
  loading: () => null,
  ssr: false,
});

// The bar only mirrors `?s=` on the search page itself; anywhere else it is a plain placeholder.
function isSearchPage(pathname: string | null | undefined) {
  if (!pathname) return false;
  const locale = pathname.split('/')[1];
  const path = isValidLocale(locale) ? stripLocalePrefix(pathname, locale) : pathname;
  return path === '/search';
}

// The platform never changes during a session, so there is nothing to subscribe to.
const noopSubscribe = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/i.test(navigator.userAgent);
const getServerIsMac = () => false;

function getSearchQueryFromUrl() {
  if (typeof window === 'undefined' || !isSearchPage(window.location.pathname)) return '';
  return new URLSearchParams(window.location.search).get('s') ?? '';
}

export const SearchBar = () => {
  const t = useTranslations();
  const [initialQuery, setInitialQuery] = React.useState<string>('');
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  // Only drives the ⌘/Ctrl hint; the shortcut itself accepts both modifiers.
  const isMac = React.useSyncExternalStore(noopSubscribe, getIsMac, getServerIsMac);

  // Read the URL at open time so the modal never starts from a query the page has moved past.
  const openSearch = () => {
    setInitialQuery(getSearchQueryFromUrl());
    onOpen();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;

    // toLowerCase: Caps Lock reports 'K'; `key` is missing on Chrome autofill keydowns
    if ((event.metaKey || event.ctrlKey) && event.key?.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpen]);

  const label = t('Layout.search-by');

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={onClose} initialQuery={initialQuery} />
      <InputGroup
        maxW="700px"
        w="100%"
        minW={0}
        h="100%"
        maxH="50px"
        overflow="hidden"
        startElement={<SearchIcon color="gray.300" />}
        startElementProps={{ pointerEvents: 'none', h: '100%' }}
        endElement={
          <Flex mr={1} h="100%" w="auto" gap={2} alignItems="center" flexShrink={0}>
            <Flex
              opacity={0.5}
              gap={1}
              userSelect="none"
              pointerEvents="none"
              aria-hidden="true"
              display={{ base: 'none', md: 'flex' }}
              alignItems="center"
            >
              <Kbd fontSize="xs">{isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd fontSize="xs">K</Kbd>
            </Flex>
            <SearchMenu />
          </Flex>
        }
        endElementProps={{ h: '100%', w: 'auto', display: 'flex', alignItems: 'center', px: 0 }}
      >
        <Button
          variant="subtle"
          bg="gray.700"
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="normal"
          justifyContent="flex-start"
          h="100%"
          w="100%"
          maxW="100%"
          minW={0}
          minH={0}
          overflow="hidden"
          flexShrink={1}
          borderRadius="l2"
          css={{ '--input-height': '2.5rem' }}
          onClick={openSearch}
          _hover={{ bg: 'gray.700' }}
          _expanded={{ bg: 'gray.700' }}
          _focusVisible={{ bg: 'gray.700', outline: '2px solid', outlineColor: 'blue.400' }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={label}
          data-sentry-label="HeaderSearch"
          cursor="text"
        >
          {/* useSearchParams opts the layout out of prerendering up to the closest Suspense */}
          <Suspense fallback={<SearchBarText label={label} />}>
            <SearchBarQuery label={label} />
          </Suspense>
        </Button>
      </InputGroup>
    </>
  );
};

const SearchBarQuery = (props: { label: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = isSearchPage(pathname) ? (searchParams?.get('s') ?? '') : '';

  return <SearchBarText label={props.label} search={search} />;
};

const SearchBarText = (props: { label: string; search?: string }) => (
  <Text
    as="span"
    display="block"
    w="100%"
    maxW="100%"
    minW={0}
    overflow="hidden"
    textOverflow="ellipsis"
    whiteSpace="nowrap"
    textAlign="left"
    color={props.search ? 'inherit' : 'whiteAlpha.400'}
    userSelect="none"
    pointerEvents="none"
  >
    {props.search || props.label}
  </Text>
);
