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
} from '@chakra-ui/react';

import NextImage from 'next/image';
import logo from '../public/logo_white_compressed.svg';
import logo_icon from '../public/logo_icon.svg';
import mt_logo from '../public/magnetismo-logo.png';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LoginModal from './Modal/LoginModal';
import { useAuth } from '../utils/auth';
import { AiFillHeart } from 'react-icons/ai';
import { BsBoxArrowInRight, BsFillPersonFill } from 'react-icons/bs';
import { NextSeo, NextSeoProps } from 'next-seo';
import { SearchBar } from './Search/SearchBar';
import ClientOnly from './Utils/ClientOnly';
import Color from 'color';

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
};

const Layout = (props: Props) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signout } = useAuth();
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

  const onSubmit = (e: any, search: string) => {
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
              priority
              display={{ base: 'inherit', md: 'none' }}
            />
            <Image
              as={NextImage}
              src={logo}
              alt="itemdb logo"
              width={175}
              quality={100}
              priority
              display={{ base: 'none', md: 'inherit' }}
            />
          </Flex>
          <Box flex="1 1 auto" display="flex" justifyContent="center" alignItems="center">
            <SearchBar onSubmit={onSubmit} />
          </Box>
          <Box
            as={ClientOnly}
            display="flex"
            gap={{ base: 2, md: 3 }}
            alignItems="center"
            maxW="30%"
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
                      <MenuItem as={Link} href={`/feedback`}>
                        Feedback
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
            flexFlow={['column', 'row']}
            gap={[6, 20]}
          >
            <Flex
              flexFlow={'column'}
              textAlign={['center', 'right']}
              gap={8}
              justifyContent="center"
              alignItems={['center', 'flex-end']}
            >
              <ChakraLink href="https://magnetismotimes.com/" isExternal>
                <NextImage src={mt_logo} width={202} height={50} alt="Magnetismo Times logo" />
              </ChakraLink>
              <Text fontSize="xs" color="gray.500">
                © 2009-{new Date().getFullYear()}{' '}
                <ChakraLink href="https://magnetismotimes.com/" isExternal>
                  Magnetismo Times
                </ChakraLink>
                <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
                permission.
              </Text>
            </Flex>
            <Flex flexFlow={['row']} gap={[3, 12]} justifyContent="center">
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>Resources</b>
                </Text>
                <ChakraLink href="/articles">Articles</ChakraLink>
                <ChakraLink href="/lists/official">Official Lists</ChakraLink>
                <ChakraLink href="/articles/owls">Owls</ChakraLink>
                <ChakraLink href="/articles/userscripts">Userscripts</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>Contribute</b>
                </Text>
                <ChakraLink href="/contribute">Item Data Extractor</ChakraLink>
                <ChakraLink href="/feedback">Feedback</ChakraLink>
                <ChakraLink href="/feedback/trades">Trade Pricing</ChakraLink>
                <ChakraLink href="/contribute">+ More</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>itemdb</b>
                </Text>
                <ChakraLink href="https://itemdb.stoplight.io/docs/itemdb-api" isExternal>
                  Developers
                </ChakraLink>
                <ChakraLink href="/privacy">Privacy Policy (Aug 2023)</ChakraLink>
                <ChakraLink href="/terms">Terms of Use</ChakraLink>
                <ChakraLink href="https://github.com/lucca180/itemdb/" isExternal>
                  Source Code
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
