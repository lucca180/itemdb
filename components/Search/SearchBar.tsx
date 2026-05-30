import { SearchIcon } from '@utils/theme/chakraIcons';
import { InputGroup, useDisclosure, Input, Flex, Kbd } from '@chakra-ui/react';
import React from 'react';
import dynamic from 'next/dynamic';
import SearchMenu from '../Menus/SearchMenu';
import { useRouter } from 'next/compat/router';
import { useTranslations } from 'next-intl';

const SearchModal = dynamic(() => import('./SearchModal'));

export const SearchBar = () => {
  const t = useTranslations();
  const [search, setSearch] = React.useState<string>('');
  const { open: isOpen, onToggle, onClose } = useDisclosure();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/Mac/i.test(navigator.userAgent));
  }, []);

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
      {isOpen && <SearchModal isOpen={isOpen} onClose={handleClose} />}
      <InputGroup
        maxW="700px"
        w="100%"
        h="100%"
        maxH="50px"
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
          onFocus={onToggle}
          value={search}
          ref={inputRef}
          placeholder={t('Layout.search-by')}
          _focus={{ bg: 'gray.700' }}
          readOnly
          h="100%"
        />
      </InputGroup>
    </>
  );
};
