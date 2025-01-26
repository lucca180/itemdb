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
  Flex,
  PopoverFooter,
  Kbd,
  useOutsideClick,
  Badge,
  Box,
} from '@chakra-ui/react';
import React, { useCallback } from 'react';
import SearchMenu from '../Menus/SearchMenu';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ItemData, ShopInfo, UserList } from '../../types';
import NextLink from 'next/link';
import debounce from 'lodash/debounce';
import ItemCtxMenu, { CtxTrigger } from '../Menus/ItemCtxMenu';
import qs from 'qs';
import { getFiltersDiff } from '../../pages/search';
import { parseFilters } from '../../utils/parseFilters';
import { useTranslations } from 'next-intl';
import { ItemCardBadge } from '../Items/ItemCard';
import { slugify, stripMarkdown } from '../../utils/utils';
import HeadingLine from '../Utils/HeadingLine';

const Axios = axios.create({
  baseURL: '/api/v1/',
});

type Props = {
  onSubmit: (e: any, search: string, params: string) => void;
};

export const SearchBar = (props: Props) => {
  const t = useTranslations();
  const [search, setSearch] = React.useState<string>('');
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)');
  const [searchResult, setResult] = React.useState<{
    items: ItemData[];
    lists: UserList[];
    restockShop: ShopInfo[];
  } | null>(null);
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isMobile] = useMediaQuery('(hover: none)');

  let disableListener = false;

  useOutsideClick({
    ref: inputRef as any,
    handler: (e: any) => {
      if (disableListener) return;
      let isRightMB;
      if ('which' in e) isRightMB = e.which == 3;
      else if ('button' in e) isRightMB = e.button == 2;

      if (isRightMB) return;

      onClose();
    },
  });

  const submit = (e: any) => {
    e.preventDefault();

    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    });
    const queryFilters = getFiltersDiff(queryStrings);

    const [filters, query] = parseFilters(search);

    const params = getFiltersDiff(filters);

    let paramsString = qs.stringify(
      { ...queryFilters, ...params },
      {
        arrayFormat: 'brackets',
        encode: false,
      }
    );

    paramsString = paramsString ? '&' + paramsString : '';

    props.onSubmit(e, query, paramsString);
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

    try {
      const searchRes = await Axios.get('search/omni', {
        params: {
          s: newSearch.trim(),
          limit: 5,
        },
      });

      setResult(searchRes.data);
    } catch (e) {
      console.error(e);
    }

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
      closeOnBlur={false}
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
            placeholder={isLargerThanMD ? t('Layout.search-by') : t('Layout.search-the-database')}
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
          {!isLoading && searchResult && (
            <>
              {searchResult.items.length === 0 &&
                searchResult.lists.length === 0 &&
                searchResult.restockShop.length === 0 && (
                  <Text textAlign="center">{t('Layout.no-results-found')}</Text>
                )}
              {searchResult.items.length > 0 &&
                searchResult.items.map((item) => (
                  <React.Fragment key={item.internal_id}>
                    <ItemCtxMenu
                      item={item}
                      onShow={() => (disableListener = true)}
                      onHide={() => (disableListener = false)}
                    />
                    <CtxTrigger
                      id={item.internal_id.toString()}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      //@ts-ignore
                      disableWhileShiftPressed
                      disable={isMobile ? true : undefined}
                    >
                      <Link
                        as={NextLink}
                        display="flex"
                        prefetch={false}
                        href={`/item/${item.slug}?utm_content=omni-search`}
                        key={item.internal_id}
                        px={{ base: 1, md: 2 }}
                        py={2}
                        alignItems="center"
                        cursor={'pointer'}
                        _hover={{
                          bg: `rgba(${item.color.rgb[0]},${item.color.rgb[1]}, ${item.color.rgb[2]},.35)`,
                        }}
                        _focus={{
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
                        <Flex flexFlow="column" alignItems="flex-start">
                          {item.name}

                          <ItemCardBadge item={item} />
                        </Flex>
                      </Link>
                    </CtxTrigger>
                  </React.Fragment>
                ))}
              <Box display={{ base: 'none', md: 'block' }}>
                {searchResult.lists.length > 0 && (
                  <>
                    <HeadingLine as={Link} href="/lists/official" fontSize={'sm'} my={1}>
                      {t('General.official-lists')}
                    </HeadingLine>

                    {searchResult.lists.map((list) => (
                      <Link
                        as={NextLink}
                        display="flex"
                        prefetch={false}
                        href={`/lists/official/${list.slug}?utm_content=omni-search`}
                        key={list.internal_id}
                        px={{ base: 1, md: 2 }}
                        py={2}
                        alignItems="center"
                        cursor={'pointer'}
                        _hover={{
                          bg: `${list.colorHex}23`,
                        }}
                        _focus={{
                          bg: `${list.colorHex}23`,
                        }}
                        fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                        onClick={onClose}
                      >
                        <Image
                          src={list.coverURL!}
                          boxSize="35px"
                          mr={2}
                          alt={list.name}
                          borderRadius="sm"
                          objectFit={'cover'}
                        />
                        <Flex flexFlow="column" alignItems="flex-start">
                          {list.name}
                          <Text display={{ base: 'none', lg: 'block' }} fontSize={'xs'}>
                            {stripMarkdown(list.description ?? '')}
                          </Text>
                          {/* <ItemCardBadge item={item} /> */}
                        </Flex>
                      </Link>
                    ))}
                  </>
                )}
                {searchResult.restockShop.length > 0 && (
                  <>
                    <HeadingLine as={Link} href="/restock" my={1} fontSize={'sm'}>
                      {t('General.restock-shops')}
                    </HeadingLine>

                    {searchResult.restockShop.map((shop) => (
                      <Link
                        as={NextLink}
                        display="flex"
                        prefetch={false}
                        href={`/restock/${slugify(shop.name)}?utm_content=omni-search`}
                        key={shop.id}
                        px={{ base: 1, md: 2 }}
                        py={2}
                        alignItems="center"
                        cursor={'pointer'}
                        _hover={{
                          bg: `${shop.color}23`,
                        }}
                        _focus={{
                          bg: `${shop.color}23`,
                        }}
                        fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                        onClick={onClose}
                      >
                        <Image
                          objectPosition={'center'}
                          src={`https://images.neopets.com/themes/h5/basic/images/v3/shop-icon.svg`}
                          boxSize="35px"
                          mr={2}
                          alt={shop.name}
                          borderRadius="sm"
                          objectFit={'cover'}
                        />
                        <Flex flexFlow="column" alignItems="flex-start">
                          {shop.name}
                          <Badge>{shop.category}</Badge>
                        </Flex>
                      </Link>
                    ))}
                  </>
                )}
              </Box>
            </>
          )}
        </PopoverBody>
        {!isLoading && searchResult && searchResult.items.length > 0 && (
          <PopoverFooter textAlign={'center'}>
            <Text fontSize="sm">
              {t('Layout.or-just-press')}{' '}
              <Kbd verticalAlign={'middle'}>{t('Layout.key-enter')}</Kbd>
            </Text>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  );
};
