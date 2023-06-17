import { SearchIcon } from '@chakra-ui/icons';
import {
  InputGroup,
  useDisclosure,
  InputLeftElement,
  Input,
  InputRightElement,
  useMediaQuery,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  Center,
  Spinner,
  Image,
  Link,
  PopoverFooter,
  Kbd,
  useOutsideClick,
} from '@chakra-ui/react';
import React, { useCallback } from 'react';
import SearchMenu from '../Menus/SearchMenu';
import { useRouter } from 'next/router';
import axios from 'axios';
import { SearchResults } from '../../types';
import NextLink from 'next/link';
import debounce from 'lodash/debounce';

const Axios = axios.create({
  baseURL: '/api/',
});

type Props = {
  onSubmit: (e: any, search: string) => void;
};

export const SearchBar = (props: Props) => {
  const [search, setSearch] = React.useState<string>('');
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)');
  const [searchResult, setResult] = React.useState<SearchResults | null>(null);
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  useOutsideClick({
    ref: inputRef,
    handler: () => onClose(),
  });

  const submit = (e: any) => {
    e.preventDefault();
    props.onSubmit(e, search);
    onClose();
  };

  React.useEffect(() => {
    if (!router.isReady) return;
    setSearch((router.query.s as string) ?? '');
  }, [router.query.s]);

  React.useEffect(() => {
    if (search === router.query.s) return onClose();

    debouncedPreSearch(search);
  }, [search]);

  const preSearch = async (newSearch: string) => {
    if (newSearch.trim().length < 3) return onClose();
    setLoading(true);
    if (!isOpen) onToggle();

    const searchRes = await Axios.get('search?s=' + encodeURIComponent(newSearch.trim()), {
      params: {
        limit: 5,
      },
    });

    setResult(searchRes.data);
    setLoading(false);
  };

  const debouncedPreSearch = useCallback(
    debounce((newValue: string) => {
      preSearch(newValue);
    }, 375),
    [isOpen]
  );

  return (
    <Popover
      returnFocusOnClose={false}
      isOpen={isOpen}
      placement="bottom"
      isLazy
      matchWidth
      closeOnEsc
      autoFocus={false}
    >
      <PopoverTrigger>
        <InputGroup as="form" onSubmit={submit} maxW="700px" w="100%" h="100%" maxH="50px">
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
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            ref={inputRef}
            placeholder={
              isLargerThanMD ? 'Search by name or hex color (eg: #fff000)' : 'Search the database'
            }
            _focus={{ bg: 'gray.700' }}
            h="100%"
          />
          <InputRightElement mr={1} children={<SearchMenu />} h="100%" />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent w="100%">
        <PopoverBody>
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!isLoading && searchResult && searchResult.content.length === 0 && (
            <Text textAlign="center">No results found</Text>
          )}
          {!isLoading &&
            searchResult &&
            searchResult.content.length > 0 &&
            searchResult.content.map((item) => (
              <Link
                as={NextLink}
                display="flex"
                href={`/item/${item.slug}`}
                key={item.internal_id}
                px={{ base: 1, md: 2 }}
                py={2}
                alignItems="center"
                cursor={'pointer'}
                _hover={{
                  bg: `rgba(${item.color.rgb[0]},${item.color.rgb[1]}, ${item.color.rgb[2]},.35)`,
                }}
                fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                onClick={onClose}
              >
                <Image
                  src={item.image}
                  boxSize="35px"
                  mr={2}
                  alt={item.description}
                  borderRadius="sm"
                />
                {item.name}
              </Link>
            ))}
        </PopoverBody>
        {!isLoading && searchResult && searchResult.content.length > 0 && (
          <PopoverFooter textAlign={'center'}>
            <Text fontSize="sm">
              or just press <Kbd verticalAlign={'middle'}>enter</Kbd>
            </Text>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  );
};
