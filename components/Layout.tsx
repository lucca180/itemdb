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
  Portal,
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
import { DropdownButton, DropdownOption } from './Menus/HeaderDropdown';
import { SiteAlert } from './Utils/SiteAlert';
import { getScriptStatus } from '../utils/scriptUtils';
import FeedbackButton from './Feedback/FeedbackButton';

const LanguageToast = dynamic<LanguageToastProps>(() => import('./Modal/LanguageToast'));
const LoginModal = dynamic<LoginModalProps>(() => import('./Modal/LoginModal'));

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
  mainColor?: string;
  fullWidth?: boolean;
};

const Layout = (props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signout, authLoading } = useAuth();
  const [isLargerThanMD] = useMediaQuery('(min-width: 48em)', {
    ssr: true,
    fallback: false,
  });

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
        <SiteAlert />
        <Flex
          as="header"
          w="full"
          maxW="8xl"
          marginX="auto"
          gap={{ base: 2, md: 4 }}
          px={{ base: 2, md: 4 }}
          py={5}
        >
          <Flex as={Link} prefetch={false} href="/" flex={'0 0 auto'}>
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
              prefetch={false}
              href="/contribute"
              colorScheme="whiteAlpha"
              data-umami-event="heart-button"
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
                  {t('Layout.login')}
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
                    data-umami-event="profile-menu-button"
                  >
                    {isLargerThanMD && (
                      <Box as="span">{t('Layout.hi-user', { name: user.username })}</Box>
                    )}
                    <Icon
                      as={BsFillPersonFill}
                      display={{ base: 'inherit', md: 'none' }}
                      boxSize="18px"
                    />
                  </MenuButton>
                  <Portal>
                    <MenuList>
                      <MenuGroup
                        title={
                          !isLargerThanMD
                            ? `${t('Layout.hello-user', { name: user.username })}`
                            : undefined
                        }
                      >
                        <MenuItem as={Link} prefetch={false} href={`/lists/${user.username}`}>
                          {t('Layout.my-lists')}
                        </MenuItem>
                        <MenuItem as={Link} prefetch={false} href={`/contribute`}>
                          {t('Layout.how-to-contribute')}
                        </MenuItem>
                      </MenuGroup>
                      {isLargerThanMD && <ScriptStatus />}
                      <MenuDivider />
                      <MenuItem onClick={signout}>{t('Layout.logout')}</MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              </>
            )}
          </Box>
        </Flex>
        <Flex
          bg={props.mainColor}
          justifyContent={'center'}
          alignItems={'center'}
          py={1}
          gap={{ base: 1, md: 3 }}
        >
          <DropdownButton label={t('Layout.home')} href="/" />
          <DropdownButton bg={props.mainColor} label={t('Layout.articles')} href="/articles">
            <DropdownOption label={t('Layout.userscripts')} href="/articles/userscripts" />
            <DropdownOption label={'The Void Within'} href="/hub/the-void-within" />
            <DropdownOption label={t('Layout.patch-notes')} href="/articles" />
            <DropdownOption label={t('Layout.how-to-contribute')} href="/contribute" />
            <DropdownOption
              label={t('Layout.sort-galleries-by-color')}
              href="/articles/sort-gallery"
            />
            <DropdownOption
              label={t('Layout.advanced-search-queries')}
              href="/articles/advanced-search-queries"
            />
          </DropdownButton>
          <DropdownButton bg={props.mainColor} label={t('Layout.restock')} href="/restock">
            <DropdownOption label={t('Layout.restock-dashboard')} href="/restock/dashboard" />
            <DropdownOption label={'Neopian Fresh Foods'} href="/restock/neopian-fresh-foods" />
            <DropdownOption label={"Cog's Tog"} href="/restock/cogs-togs" />
            <DropdownOption
              label={t('Restock.restock-history')}
              href="/restock/neopian-fresh-foods/history"
            />
            <DropdownOption label={t('Layout.view-all-shops')} href="/restock/" />
          </DropdownButton>
          <DropdownButton bg={props.mainColor} label={t('Lists.Lists')} href="/lists/official">
            <DropdownOption label={t('Layout.import-items-and-checklists')} href="/lists/import" />
            <DropdownOption
              label={t('Layout.dailies-and-freebies')}
              href="/lists/official/cat/dailies"
            />
            <DropdownOption
              label={t('Layout.exclusive-clothes')}
              href="/hub/outfits/aisha"
              newUntil={1748735999000}
            />
            <DropdownOption
              label={t('General.dynamic-lists')}
              href="/articles/checklists-and-dynamic-lists"
            />
            <DropdownOption label={t('HomePage.leaving-nc-mall')} href="/mall/leaving" />
            <DropdownOption label={'Quest Log'} href="/lists/official/cat/quest-log" />
            <DropdownOption label={t('Layout.all-official-lists')} href="/lists/official" />
          </DropdownButton>
          <DropdownButton bg={props.mainColor} label={t('Layout.tools')} href="/tools/rainbow-pool">
            <DropdownOption label={t('Layout.sdb-pricer')} href="/articles/userscripts" />
            <DropdownOption label={t('Layout.userscripts')} href="/articles/userscripts" />
            <DropdownOption label={t('Layout.rainbow-pool-tool')} href="/tools/rainbow-pool" />
            <DropdownOption label={t('Layout.item-effects')} href="/hub/item-effects" />
            <DropdownOption label={t('Layout.restock-dashboard')} href="/restock/dashboard" />
            <DropdownOption
              label={t('Calculator.pricing-calculator')}
              href="/tools/price-calculator"
            />
          </DropdownButton>
          <DropdownButton bg={props.mainColor} label={t('Layout.contribute')} href="/contribute">
            <DropdownOption label={'Item Data Extractor'} href="/contribute" />
            <DropdownOption label={t('Layout.missing-info-hub')} href="/hub/missing-info" />
            <DropdownOption label={t('Layout.trade-pricing')} href="/feedback/trades" />
            <DropdownOption label={t('Feedback.suggestion-voting')} href="/feedback/vote" />
            <DropdownOption label={t('Layout.feedback-and-ideas')} href="/feedback" />
            <DropdownOption label={t('Layout.report-your-nc-trades')} href="/mall/report" />
          </DropdownButton>
        </Flex>
        <Box
          as="main"
          flex="1"
          w="full"
          maxW={props.fullWidth ? undefined : '8xl'}
          marginX="auto"
          px={props.fullWidth ? undefined : 4}
          pb={6}
          h="100%"
        >
          {!props.loading && props.children}
          {props.loading && (
            <Center h="80vh" flexFlow="column" gap={3}>
              <Spinner size="lg" />
              <Text>{t('Layout.loading')}</Text>
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
                {t('Layout.made-in')}{' '}
                <NextImage
                  src={Brazil}
                  alt="Brazil Flag"
                  width={18}
                  style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
                />{' '}
                {t('Layout.by')}{' '}
                <ChakraLink href="https://magnetismotimes.com/" isExternal>
                  Magnetismo Times
                </ChakraLink>
                <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used
                with permission.
              </Text>
              <Flex alignItems={'flex-end'} gap={4}>
                <FeedbackButton
                  bg="whiteAlpha.200"
                  variant={'solid'}
                  size="xs"
                  flex="1"
                  h="25px"
                  borderRadius="md"
                />
                <Select
                  borderRadius="md"
                  bg="whiteAlpha.200"
                  size="xs"
                  variant="filled"
                  defaultValue={router.locale ?? 'en'}
                  flex="1"
                  minW="120px"
                  h="25px"
                  onChange={(e) => changeLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </Select>
              </Flex>
            </Flex>
            <Flex flexFlow={['row']} gap={[3, 12]} justifyContent="center">
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>{t('Layout.resources')}</b>
                </Text>
                <ChakraLink href="/articles/lebron">Lebron</ChakraLink>
                <ChakraLink href="https://docs.itemdb.com.br" isExternal>
                  {t('Layout.devs')}
                </ChakraLink>
                <ChakraLink href="/lists/official">{t('Layout.official-lists')}</ChakraLink>
                <ChakraLink href="/articles/userscripts">{t('Layout.userscripts')}</ChakraLink>
                <ChakraLink href="/public-data">{t('Layout.public-data')}</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>{t('Layout.contribute')}</b>
                </Text>
                <ChakraLink href="/contribute">Item Data Extractor</ChakraLink>
                <ChakraLink href="/feedback">{t('Feedback.vote-suggestions')}</ChakraLink>
                <ChakraLink href="/feedback/trades">{t('Layout.trade-pricing')}</ChakraLink>
                <ChakraLink href="/contribute">+ {t('Layout.more')}</ChakraLink>
              </Flex>
              <Flex flex="1" flexFlow={'column'} fontSize="xs" gap={2} color="gray.300">
                <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                  <b>itemdb</b>
                </Text>
                <ChakraLink href="/privacy">{t('Layout.privacy-policy')}</ChakraLink>
                <ChakraLink href="/terms">{t('Layout.terms-of-use')}</ChakraLink>
                <ChakraLink href="/feedback">{t('Feedback.contact-us')}</ChakraLink>
                <ChakraLink href="https://github.com/lucca180/itemdb/" isExternal>
                  {t('Layout.source-code')}
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

const ScriptStatus = () => {
  const scriptStatus = getScriptStatus();
  const t = useTranslations();

  if (!scriptStatus) return null;

  return (
    <>
      <MenuDivider />
      <Text px={3} pb={3} fontSize={'md'} color="white">
        {t('Layout.script-info')}
      </Text>
      {Object.values(scriptStatus).map((script) => {
        if (script.status === 'notFound' && script.name !== 'Item Data Extractor') return null;
        return (
          <Flex
            key={script.name}
            alignItems="center"
            gap={2}
            fontSize="xs"
            color="whiteAlpha.700"
            px={3}
            pb={2}
          >
            <Text>
              {script.name} {script.version ? `- ${script.version}` : ''}
            </Text>
            {script.status === 'outdated' && (
              <Button
                as="a"
                href={script.link}
                target="_blank"
                size={'xs'}
                variant={'outline'}
                colorScheme="orange"
              >
                {t('Layout.update-available')}
              </Button>
            )}
            {script.status === 'notFound' && (
              <Button
                as="a"
                href={script.link}
                target="_blank"
                size={'xs'}
                variant={'outline'}
                colorScheme="green"
              >
                {t('Restock.install-now')}
              </Button>
            )}
          </Flex>
        );
      })}
    </>
  );
};
