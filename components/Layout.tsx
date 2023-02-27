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
} from '@chakra-ui/react';

import Image from 'next/image';
import logo from '../public/logo_white.svg';
import { ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchMenu from './Menus/SearchMenu';
import LoginModal from './Modal/LoginModal';
import { useAuth } from '../utils/auth';

type Props = {
  children: ReactNode;
};

const Layout = (props: Props) => {
  const router = useRouter();
  const [search, setSearch] = React.useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, authLoading, signout } = useAuth();

  useEffect(() => {
    if (!router.isReady) return;
    setSearch((router.query.s as string) ?? '');
  }, [router.isReady]);

  const onSubmit = (e: any) => {
    e.preventDefault();
    router.push(`/search?s=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <LoginModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow="column" minH="100vh">
        <Box
          as="header"
          w="full"
          maxW="8xl"
          marginX="auto"
          display="flex"
          gap={4}
          justifyContent="space-between"
          px={4}
          py={6}
        >
          <Link href="/">
            <Image src={logo} alt="itemdb logo" width={175} quality={100} />
          </Link>
          <Box flex="1 0 auto" display="flex" justifyContent="center">
            <InputGroup
              as="form"
              onSubmit={onSubmit}
              maxW="700px"
              w="100%"
              h="100%"
            >
              <InputLeftElement
                pointerEvents="none"
                h="100%"
                children={<SearchIcon color="gray.300" />}
              />
              <Input
                h="100%"
                variant="filled"
                bg="gray.700"
                type="text"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                placeholder="Search by name or hex color (eg: #fff000)"
                _focus={{ bg: 'gray.700' }}
              />
              <InputRightElement h="100%" mr={1} children={<SearchMenu />} />
            </InputGroup>
          </Box>
          <Box display="flex" gap={3} alignItems="center" maxW="30%">
            {authLoading && <Text>Loading...</Text>}
            {!authLoading && (
              <>
                {!user && (
                  <Button
                    as="a"
                    href="http://magnetismotimes.com/"
                    target="_blank"
                    colorScheme="whiteAlpha"
                    bg="gray.200"
                    _hover={{ bg: 'gray.200' }}
                    _active={{ bg: 'gray.200' }}
                    fontSize="sm"
                  >
                    How to Contribute
                  </Button>
                )}
                {!user && (
                  <Button variant="ghost" fontSize="sm" onClick={onOpen}>
                    Login
                  </Button>
                )}
                {user && (
                  <>
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Hi, {user.username}
                      </MenuButton>
                      <MenuList>
                        <MenuItem>My Lists</MenuItem>
                        <MenuItem>How to Contribute</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={signout}>Logout</MenuItem>
                      </MenuList>
                    </Menu>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
        <Box
          as="main"
          flex="1"
          w="full"
          maxW="8xl"
          marginX="auto"
          px={4}
          pb={6}
          h="100%"
        >
          {props.children}
        </Box>
        <Box as="footer" textAlign={'center'} py={2}>
          <Text fontSize="xs" color="gray.500">
            © 2009-{new Date().getFullYear()} Magnetismo Times
            <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights
            reserved. Used with permission.
          </Text>
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
