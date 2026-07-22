'use client';

import { SearchIcon } from '@utils/theme/chakraIcons';
import { InputGroup, useDisclosure, Input, Flex, Kbd } from '@chakra-ui/react';
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/compat/router';
import { useTranslations } from 'next-intl';
import SearchMenu from '../Menus/SearchMenu';

const loadSearchModal = () => import('./SearchModal');

const SearchModal = dynamic(loadSearchModal, {
  loading: () => null,
  ssr: false,
});

function preloadSearchModal() {
  void loadSearchModal();
}

function getSearchQueryFromUrl() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('s') ?? '';
}

export const SearchBar = () => {
  const t = useTranslations();
  const [search, setSearch] = React.useState<string>('');
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/Mac/i.test(navigator.userAgent));
  }, []);

  // Warm the SearchModal chunk so the first open does not wait on the network.
  React.useEffect(() => {
    const ric = window.requestIdleCallback?.(preloadSearchModal, { timeout: 3000 });
    if (ric == null) {
      const t = window.setTimeout(preloadSearchModal, 1500);
      return () => window.clearTimeout(t);
    }
    return () => window.cancelIdleCallback?.(ric);
  }, []);

  // Mirror the current ?s= query in the read-only bar (Pages Router or App Router fallback).
  React.useEffect(() => {
    if (router?.isReady) {
      setSearch((router.query.s as string) ?? '');
      return;
    }

    // compat router is null on App Router — read directly from the browser URL.
    setSearch(getSearchQueryFromUrl());
  }, [router?.isReady, router?.query.s]);

  const handleClose = () => {
    onClose();
    inputRef.current?.blur();
  };

  const openSearch = () => {
    preloadSearchModal();
    onOpen();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;

    if (
      (isMac && event.metaKey && event.key === 'k') ||
      (!isMac && event.ctrlKey && event.key === 'k')
    ) {
      event.preventDefault();
      preloadSearchModal();
      if (isOpen) {
        onClose();
        return;
      }
      onOpen();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMac, isOpen, onClose, onOpen]);

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={handleClose} />
      <InputGroup
        maxW="700px"
        w="100%"
        h="100%"
        maxH="50px"
        onPointerEnter={preloadSearchModal}
        startElement={<SearchIcon color="gray.300" />}
        startElementProps={{ pointerEvents: 'none', h: '100%' }}
        endElement={
          <Flex mr={1} h="100%" w="auto" gap={2} alignItems="center">
            <Flex
              opacity={0.5}
              gap={1}
              userSelect={'none'}
              pointerEvents={'none'}
              aria-hidden="true"
              display={{ base: 'none', md: 'flex' }}
              alignItems={'center'}
            >
              <Kbd fontSize={'xs'}>{isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd fontSize={'xs'}>K</Kbd>
            </Flex>
            <SearchMenu />
          </Flex>
        }
        endElementProps={{ h: '100%', w: 'auto', display: 'flex', alignItems: 'center', px: 0 }}
      >
        <Input
          variant="subtle"
          name="search"
          autoComplete="off"
          bg="gray.700"
          type="text"
          fontSize={{ base: 'sm', md: 'md' }}
          onFocus={openSearch}
          value={search}
          ref={inputRef}
          placeholder={t('Layout.search-by')}
          _focus={{ bg: 'gray.700' }}
          readOnly
          h="100%"
          data-sentry-label="HeaderSearch"
        />
      </InputGroup>
    </>
  );
};
