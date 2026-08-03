'use client';

import { SearchIcon } from '@utils/theme/chakraIcons';
import { InputGroup, useDisclosure, Button, Flex, Kbd, Text } from '@chakra-ui/react';
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/compat/router';
import { useTranslations } from 'next-intl';
import SearchMenu from '../Menus/SearchMenu';

const SearchModal = dynamic(() => import('@components/Search/SearchModal'), {
  loading: () => null,
  ssr: false,
});

function getSearchQueryFromUrl() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('s') ?? '';
}

export const SearchBar = () => {
  const t = useTranslations();
  const [search, setSearch] = React.useState<string>('');
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/Mac/i.test(navigator.userAgent));
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

  const openSearch = () => {
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
      openSearch();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMac, onOpen]);

  const label = t('Layout.search-by');

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={onClose} initialQuery={search} />
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
            color={search ? 'inherit' : 'whiteAlpha.400'}
            userSelect="none"
            pointerEvents="none"
          >
            {search || label}
          </Text>
        </Button>
      </InputGroup>
    </>
  );
};
