import React, { ReactNode, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
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
} from '@chakra-ui/react';

import NextImage from 'next/image';
import logo from '../public/logo_white.svg';
import logo_icon from '../public/logo_icon.svg';
import { ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchMenu from './Menus/SearchMenu';
import LoginModal from './Modal/LoginModal';
import { useAuth } from '../utils/auth';
import { AiFillHeart } from 'react-icons/ai';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';
import { NextSeo, NextSeoProps } from 'next-seo';

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
};

const Layout = (props: Props) => {
  const router = useRouter();
  const [search, setSearch] = React.useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, authLoading, signout } = useAuth();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)');

  useEffect(() => {
    if (!router.isReady) return;
    checkLogin();
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    setSearch((router.query.s as string) ?? '');
  }, [router.query.s]);

  const checkLogin = () => {
    if (!user) return;

    if (!user.username && !['/', '/login'].includes(router.asPath)) router.push('/login');
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    router.push(`/search?s=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <NextSeo {...props.SEO} />
      <LoginModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow="column" minH="100vh">
        <Flex as="header" w="full" maxW="8xl" marginX="auto" gap={{ base: 2, md: 4 }} px={4} py={6}>
          <Flex as={Link} href="/" flex={'0 0 auto'}>
            <Image
              as={NextImage}
              src={logo_icon}
              alt="itemdb logo"
              height="50px"
              width="auto"
              quality={100}
              display={{ base: 'inherit', md: 'none' }}
            />
            <Image
              as={NextImage}
              src={logo}
              alt="itemdb logo"
              width={175}
              quality={100}
              display={{ base: 'none', md: 'inherit' }}
            />
          </Flex>
          <Box flex="1 1 auto" display="flex" justifyContent="center" alignItems="center">
            <InputGroup as="form" onSubmit={onSubmit} maxW="700px" w="100%" h="100%" maxH="50px">
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
                placeholder={
                  isLargerThanMD
                    ? 'Search by name or hex color (eg: #fff000)'
                    : 'Search the database'
                }
                _focus={{ bg: 'gray.700' }}
                h="100%"
              />
              <InputRightElement mr={1} children={<SearchMenu />} h="100%" />
            </InputGroup>
          </Box>
          <Box display="flex" gap={{ base: 2, md: 3 }} alignItems="center" maxW="30%">
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
            {authLoading && <Button isLoading />}
            {!authLoading && (
              <>
                {!user && (
                  <Button
                    variant="filled"
                    bg="gray.700"
                    _hover={{ bg: 'gray.600' }}
                    onClick={onOpen}
                    px={{ base: 0, md: 4 }}
                  >
                    <Icon as={BsBoxArrowInRight} boxSize="18px" mr={2} verticalAlign="text-top" />
                    <Box as="span" display={{ base: 'none', md: 'inline' }}>
                      Login
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
                        {isLargerThanMD && <Box as="span">Hi, {user.username}</Box>}
                        <Icon
                          as={BsFillPersonFill}
                          display={{ base: 'inherit', md: 'none' }}
                          boxSize="18px"
                        />
                      </MenuButton>
                      <MenuList>
                        <MenuGroup title={!isLargerThanMD ? `Hello, ${user.username}` : undefined}>
                          <MenuItem as={Link} href={`/lists/${user.username}`}>
                            My Lists
                          </MenuItem>
                          <MenuItem as={Link} href={`/contribute`}>
                            How to Contribute
                          </MenuItem>
                        </MenuGroup>
                        <MenuDivider />
                        <MenuItem onClick={signout}>Logout</MenuItem>
                      </MenuList>
                    </Menu>
                  </>
                )}
              </>
            )}
          </Box>
        </Flex>
        <Box as="main" flex="1" w="full" maxW="8xl" marginX="auto" px={4} pb={6} h="100%">
          {!props.loading && props.children}
          {props.loading && (
            <Center h="80vh" flexFlow="column" gap={3}>
              <Spinner size="lg" />
              <Text>Loading</Text>
            </Center>
          )}
        </Box>
        <Flex as="footer" textAlign={'center'} p={3} flexFlow="column" gap={2}>
          <Text fontSize="xs" color="gray.400">
            <ChakraLink href="https://github.com/lucca180/itemdb/" isExternal>
              Source Code
            </ChakraLink>{' '}
            |{' '}
            <ChakraLink href="https://itemdb.stoplight.io/docs/itemdb-api" isExternal>
              API
            </ChakraLink>{' '}
            | <ChakraLink href="/terms">Terms of Use</ChakraLink> |{' '}
            <ChakraLink href="/privacy">Privacy Policy</ChakraLink>
          </Text>
          <Text fontSize="xs" color="gray.500">
            © 2009-{new Date().getFullYear()}{' '}
            <ChakraLink href="https://magnetismotimes.com/" isExternal>
              Magnetismo Times
            </ChakraLink>
            <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
            permission.
          </Text>
        </Flex>
      </Flex>
    </>
  );
};

export default Layout;
