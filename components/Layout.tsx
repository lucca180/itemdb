import React, { ReactNode, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  Image,
  Icon,
  useMediaQuery,
  MenuGroup,
  Center,
  Spinner,
  Link as ChakraLink,
  Select,
  // Badge,
} from '@chakra-ui/react';

import NextImage from 'next/image';
import logo from '../public/logo_white_compressed.svg';
import logo_icon from '../public/logo_icon.svg';
import mt_logo from '../public/magnetismo-logo.png';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LoginModalProps } from './Modal/LoginModal';
import { useAuth } from '../utils/auth';
import { AiFillHeart } from 'react-icons/ai';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';
import { NextSeo, NextSeoProps } from 'next-seo';
import { SearchBar } from './Search/SearchBar';
import Color from 'color';
import Brazil from '../public/icons/brazil.png';
import { useTranslations } from 'next-intl';
import { LanguageToastProps } from './Modal/LanguageToast';
import axios from 'axios';
import { setCookie } from 'cookies-next';
import dynamic from 'next/dynamic';

const LanguageToast = dynamic<LanguageToastProps>(() => import('./Modal/LanguageToast'));
const LoginModal = dynamic<LoginModalProps>(() => import('./Modal/LoginModal'));

const IS_GREY = process.env.NEXT_PUBLIC_IS_GREY === 'true';

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
};

const Layout = (props: Props) => {
  const t = useTranslations('Layout');
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signout, authLoading } = useAuth();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)');

  const color = Color('#4A5568');
  const rgb = color.rgb().round().array();

  useEffect(() => {
    if (!router.isReady) return;
    checkLogin();
  }, [router.isReady]);

  const checkLogin = () => {
    if (!user) return;

    if (!user.username && !['/', '/login'].includes(router.asPath)) router.push('/login');
  };

  const saveLang = async (prefLang: string) => {
    setCookie('NEXT_LOCALE', prefLang, { expires: new Date('2030-01-01') });
    if (!user) return;
    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang: prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  const changeLang = async (prefLang: string) => {
    await saveLang(prefLang);
    router.push(router.asPath, router.asPath, { locale: prefLang });
  };

  const onSubmit = (e: any, search: string, params: string) => {
    e.preventDefault();
    router.push(`/search?s=${encodeURIComponent(search)}${params}`);
  };

  return (
    <>
      <NextSeo {...props.SEO} />
      {isOpen && <LoginModal isOpen={isOpen} onClose={onClose} />}
      <LanguageToast saveLang={saveLang} />
      <Flex flexFlow="column" minH="100vh">
        {/* <Flex
          w="full"
          maxW="8xl"
          marginX="auto"
          gap={1}
          px={4}
          // pt={4}
          py={1}
          // h="26px"
          alignItems="center"
          color="blackAlpha.800"
          fontSize={'xs'}
          overflow={'auto'}
          whiteSpace={'nowrap'}
        >
          <Box w="100%" bg="green.500" position={'absolute'} h="26px" left="0" zIndex={-1} />
          <Text fontSize={'sm'}>⚠️</Text>
          <ChakraLink href="https://magnetismotimes.com/mt15/" isExternal>
            {t.rich('mt15', {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </ChakraLink>
        </Flex> */}
        <Flex
          as="nav"
          w="full"
          maxW="8xl"
          marginX="auto"
          gap={{ base: 3, md: 4 }}
          px={4}
          // pt={4}
          py={1}
          // h="26px"
          alignItems="center"
          color="whiteAlpha.700"
          fontSize={'xs'}
          overflow={'auto'}
          whiteSpace={'nowrap'}
        >
          <Box w="100%" bg="blackAlpha.400" position={'absolute'} h="26px" left="0" zIndex={-1} />
          <ChakraLink as={Link} href="/articles" prefetch={false}>
            {t('articles')}
          </ChakraLink>
          <ChakraLink as={Link} href="/lists/import" prefetch={false}>
            {t('checklists')}
          </ChakraLink>
          <ChakraLink as={Link} href="/restock/dashboard" prefetch={false}>
            {t('dashboard')}
          </ChakraLink>{' '}
          <Text display="inline-flex" alignItems={'center'} gap={1}>
            {/* <Badge colorScheme="yellow" fontSize={'9px'} verticalAlign={'middle'}>
              {t('new')}
            </Badge> */}
            <ChakraLink as={Link} href="/tools/pet-colors" prefetch={false}>
              {t('pet-color-tool')}
            </ChakraLink>{' '}
          </Text>
          <ChakraLink as={Link} href="/restock" prefetch={false}>
            {t('restock-hub')}
          </ChakraLink>{' '}
          {/* <ChakraLink as={Link} href="/articles/userscripts" prefetch={false}>
            {t('sdb-pricer')}
          </ChakraLink> */}
        </Flex>
        <Flex as="header" w="full" maxW="8xl" marginX="auto" gap={{ base: 2, md: 4 }} px={4} py={4}>
          <Flex as={Link} href="/" flex={'0 0 auto'}>
            <Image
              as={NextImage}
              src={logo_icon}
              alt="itemdb logo"
              height="50px"
              width="auto"
              quality={100}
              priority
              display={{ base: 'inherit', md: 'none' }}
              filter={IS_GREY ? 'grayscale(0.9)' : undefined}
            />
            <Image
              as={NextImage}
              src={logo}
              alt="itemdb logo"
              width={175}
              quality={100}
              priority
              display={{ base: 'none', md: 'inherit' }}
              filter={IS_GREY ? 'grayscale(0.9)' : undefined}
            />
          </Flex>
          <Flex flex="1 1 auto" justifyContent="center" alignItems="center">
            <Box maxW="650px" h="100%" flex="1">
              <SearchBar onSubmit={onSubmit} />
            </Box>
          </Flex>
          <Box
            // as={ClientOnly}
            display="flex"
            gap={{ base: 2, md: 3 }}
            alignItems="center"
            justifyContent="flex-end"
            maxW="30%"
            minW="15%"
          >
            <Button
              as={Link}
              href="/contribute"
              colorScheme="whiteAlpha"
              bg="gray.100"
              _hover={{ color: 'red.400' }}
              _active={{ bg: 'gray.200' }}
              color="red.500"
              display={{ base: 'none', sm: 'inherit' }}
            >
              <Icon as={AiFillHeart} boxSize="18px" />
            </Button>
            {!user && (
              <Button
                variant="filled"
                bg="gray.700"
                _hover={{ bg: 'gray.600' }}
                onClick={onOpen}
                px={{ base: 0, md: 4 }}
                isLoading={authLoading}
              >
                <Icon as={BsBoxArrowInRight} boxSize="18px" mr={2} verticalAlign="text-top" />
                <Box as="span" display={{ base: 'none', md: 'inline' }}>
                  {t('login')}
                </Box>
              </Button>
            )}
            {user && (
              <>
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    px={{ base: 2, md: 4 }}
                    textAlign="center"
                  >
                    {isLargerThanMD && <Box as="span">{t('hi-user', { name: user.username })}</Box>}
                    <Icon
                      as={BsFillPersonFill}
                      display={{ base: 'inherit', md: 'none' }}
                      boxSize="18px"
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuGroup
                      title={
                        !isLargerThanMD ? `${t('hello-user', { name: user.username })}` : undefined
                      }
                    >
                      <MenuItem as={Link} href={`/lists/${user.username}`}>
                        {t('my-lists')}
                      </MenuItem>
                      <MenuItem as={Link} href={`/contribute`}>
                        {t('how-to-contribute')}
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuItem onClick={signout}>{t('logout')}</MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </Box>
        </Flex>

        <Box as="main" flex="1" w="full" maxW="8xl" marginX="auto" px={4} pb={6} h="100%">
          {!props.loading && props.children}
          {props.loading && (
            <Center h="80vh" flexFlow="column" gap={3}>
              <Spinner size="lg" />
              <Text>{t('loading')}</Text>
            </Center>
          )}
        </Box>
        <Box
          as="footer"
          // textAlign={'center'}
          p={3}
          pt={10}
          mt={8}
          bgGradient={`linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        >
          <Flex
            w="full"
            maxW="8xl"
            marginX="auto"
            py={3}
            justifyContent="space-evenly"
            flexFlow={['column', 'column', 'row']}
            gap={[6, 6, 20]}
          >
            <Flex
              flexFlow={'column'}
              textAlign={['center', 'center', 'right']}
              gap={4}
              justifyContent="center"
              alignItems={['center', 'center', 'flex-end']}
            >
              <ChakraLink href="https://magnetismotimes.com/" isExternal>
                <NextImage src={mt_logo} width={202} height={50} alt="Magnetismo Times logo" />
              </ChakraLink>
              <Text fontSize="xs" color="gray.500" position={'relative'}>
                {t('made-in')}{' '}
                <NextImage
                  src={Brazil}
                  alt="Brazil Flag"
                  width={18}
                  style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
                />{' '}
                {t('by')}{' '}
                <ChakraLink href="https://magnetismotimes.com/" isExternal>
                  Magnetismo Times
                </ChakraLink>
                <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
                permission.
              </Text>
              <Box>
                <Select
                  size="xs"
                  variant="filled"
                  defaultValue={router.locale ?? 'en'}
                  onChange={(e) => changeLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </Select>
              </Box>
            </Flex>
            <Flex flexFlow={['row']} gap={[3, 12]} justifyContent="center">
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>{t('resources')}</b>
                </Text>
                <ChakraLink href="/articles/owls">Owls</ChakraLink>
                <ChakraLink href="/lists/official">{t('official-lists')}</ChakraLink>
                <ChakraLink href="/articles/userscripts">{t('userscripts')}</ChakraLink>
                <ChakraLink href="/public-data">{t('public-data')}</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>{t('contribute')}</b>
                </Text>
                <ChakraLink href="/contribute">Item Data Extractor</ChakraLink>
                <ChakraLink href="/feedback">{t('feedback')}</ChakraLink>
                <ChakraLink href="/feedback/trades">{t('trade-pricing')}</ChakraLink>
                <ChakraLink href="/contribute">+ {t('more')}</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>itemdb</b>
                </Text>
                <ChakraLink href="https://itemdb.stoplight.io/docs/itemdb-api" isExternal>
                  {t('developers')}
                </ChakraLink>
                <ChakraLink href="/privacy">{t('privacy-policy')}</ChakraLink>
                <ChakraLink href="/terms">{t('terms-of-use')}</ChakraLink>
                <ChakraLink href="https://github.com/lucca180/itemdb/" isExternal>
                  {t('source-code')}
                </ChakraLink>
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
