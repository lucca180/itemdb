import { SearchIcon } from '@chakra-ui/icons';
import {
  InputGroup,
  useDisclosure,
  InputLeftElement,
  Input,
  InputRightElement,
  useMediaQuery,
  Flex,
  Kbd,
} from '@chakra-ui/react';
import React from 'react';
import SearchMenu from '../Menus/SearchMenu';
import { useRouter } from 'next/compat/router';
import { useTranslations } from 'next-intl';
import { SearchModal } from './SearchModal';

export const SearchBar = () => {
  const t = useTranslations();
  const [search, setSearch] = React.useState<string>('');
  const [isLargerThanMD] = useMediaQuery('(min-width: 769px)');
  const { isOpen, onToggle, onClose } = useDisclosure();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isMac = typeof navigator !== 'undefined' ? /Mac/i.test(navigator.userAgent) : false;

  React.useEffect(() => {
    if (!router?.isReady) return;
    setSearch((router.query.s as string) ?? '');
  }, [router?.isReady, router?.query.s]);

  const handleClose = () => {
    onClose();
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;

    if (
      (isMac && event.metaKey && event.key === 'k') ||
      (!isMac && event.ctrlKey && event.key === 'k')
    ) {
      event.preventDefault();
      onToggle();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMac, onToggle]);

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={handleClose} />
      <InputGroup maxW="700px" w="100%" h="100%" maxH="50px">
        <InputLeftElement
          pointerEvents="none"
          children={<SearchIcon color="gray.300" />}
          h="100%"
        />
        <Input
          variant="filled"
          bg="gray.700"
          type="text"
          fontSize={{ base: 'sm', md: 'md' }}
          onFocus={onToggle}
          value={search}
          ref={inputRef}
          placeholder={isLargerThanMD ? t('Layout.search-by') : t('Layout.search-the-database')}
          _focus={{ bg: 'gray.700' }}
          readOnly
          h="100%"
        />
        <InputRightElement mr={1} h="100%" w="auto" display={'flex'} gap={2}>
          <>
            {isLargerThanMD && (
              <Flex opacity={0.5} gap={1} userSelect={'none'} pointerEvents={'none'} aria-hidden>
                <Kbd fontSize={'xs'}>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                <Kbd fontSize={'xs'}>K</Kbd>
              </Flex>
            )}
            <SearchMenu />
          </>
        </InputRightElement>
      </InputGroup>
    </>
  );
};
