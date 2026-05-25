'use client';

import { ChangeEvent, ReactNode, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Center,
  Spinner,
  NativeSelect,
  Link as ChakraLink,
} from '@chakra-ui/react';

import NextImage from 'next/image';
import logo from '../public/logo_white_compressed.svg';
import logo_icon from '../public/logo_icon.svg';
import mt_logo from '../public/magnetismo-logo.png';
import Link from 'next/link';
import { useRouter } from 'next/compat/router';
import { useAuth } from '../utils/auth';
import { NextSeo, NextSeoProps } from 'next-seo';
import { SearchBar } from './Search/SearchBar';
import Color from 'color';
import Brasil from '../public/icons/brasil.png';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageToastProps } from './Modal/LanguageToast';
import axios from 'axios';
import { setCookie } from 'cookies-next';
import dynamic from 'next/dynamic';
import { DropdownButton, DropdownOption } from './Menus/HeaderDropdown';
import { SiteAlert } from './Utils/SiteAlert';
import FeedbackButton from './Feedback/FeedbackButton';
import MainLink from './Utils/MainLink';
import { useVersionCheck } from '@utils/versionCheck';
import { AuthButton } from './Layout/AuthButton';
import {
  getLayoutFooterColumns,
  getLayoutNavSections,
  getLocalizedPath,
} from '@components/Layout/layoutData';

const LanguageToast = dynamic<LanguageToastProps>(() => import('./Modal/LanguageToast'));

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
  disableNextSeo?: boolean;
  mainColor?: string;
  fullWidth?: boolean;
};

const Layout = (props: Props) => {
  useVersionCheck();
  const t = useTranslations();
  const router = useRouter();
  const intlLocale = useLocale();
  const isAppRouter = !router;
  const currentLocale = router?.locale ?? intlLocale ?? 'en';
  const currentPath =
    router?.asPath ??
    (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/');
  const { user } = useAuth();
  const translate = (key: string) => t(key);
  const navSections = getLayoutNavSections(translate);
  const footerColumns = getLayoutFooterColumns(translate);

  const color = Color('#4A5568');
  const rgb = color.rgb().round().array();

  useEffect(() => {
    if (router && !router.isReady) return;
    checkLogin();
  }, [router?.isReady, currentPath, user]);

  const checkLogin = () => {
    if (!user) return;

    if (!user.username && !['/', '/login'].includes(currentPath)) navigate('/login');
  };

  const saveLang = async (prefLang: string) => {
    setCookie('NEXT_LOCALE', prefLang, {
      expires: new Date('2030-01-01'),
      sameSite: 'none',
      secure: true,
    });
    if (!user) return;
    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang: prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  const changeLang = async (prefLang: string) => {
    await saveLang(prefLang);
    if (!isAppRouter && router) return router.push(currentPath, currentPath, { locale: prefLang });

    window.location.assign(getLocalizedPath(currentPath, prefLang));
  };

  const navigate = (href: string) => {
    if (!isAppRouter && router) return router.push(href);
    window.location.assign(href);
  };

  return (
    <>
      {!props.disableNextSeo && <NextSeo {...props.SEO} />}
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
          <ChakraLink asChild flex="0 0 auto">
            <Link href="/" prefetch={false}>
              <Flex>
                <Box display={{ base: 'inherit', md: 'none' }}>
                  <NextImage
                    src={logo_icon}
                    alt="itemdb logo"
                    height={50}
                    style={{ height: '50px', width: 'auto' }}
                    quality={100}
                  />
                </Box>
                <Box display={{ base: 'none', md: 'inherit' }}>
                  <NextImage src={logo} alt="itemdb logo" width={175} quality={100} />
                </Box>
              </Flex>
            </Link>
          </ChakraLink>
          <Flex flex="1 1 auto" justifyContent="center" alignItems="center">
            <Box maxW="650px" h="100%" flex="1">
              <SearchBar />
            </Box>
          </Flex>
          <AuthButton />
        </Flex>
        <Flex bg={props.mainColor} as="nav" justifyContent="center">
          <Flex
            margin={'0 auto'}
            maxW="100%"
            alignItems={'center'}
            py={1}
            gap={{ base: 1, md: 3 }}
            overflowX="auto"
          >
            {navSections.map((section) => (
              <DropdownButton
                key={section.href}
                bg={section.options?.length ? props.mainColor : undefined}
                label={section.label}
                href={section.href}
              >
                {section.options?.map((option, index) => (
                  <DropdownOption
                    key={`${section.href}-${option.href}-${index}`}
                    label={option.label}
                    href={option.href}
                    newUntil={option.newUntil}
                  />
                ))}
              </DropdownButton>
            ))}
          </Flex>
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
              <MainLink href="https://magnetismotimes.com/" isExternal>
                <NextImage src={mt_logo} width={202} height={50} alt="Magnetismo Times logo" />
              </MainLink>
              <Text fontSize="xs" color="gray.500" position={'relative'}>
                {t('Layout.made-in')}{' '}
                <NextImage
                  src={Brasil}
                  alt="Brasil Flag"
                  width={18}
                  style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
                />{' '}
                {t('Layout.by')}{' '}
                <MainLink href="https://magnetismotimes.com/" isExternal>
                  Magnetismo Times
                </MainLink>
                <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
                permission.
              </Text>
              <Flex alignItems={'flex-end'} gap={4}>
                <FeedbackButton size="xs" flex="1" h="25px" borderRadius="md" />
                <NativeSelect.Root
                  size="xs"
                  variant="subtle"
                  flex="1"
                  minW="120px"
                  borderRadius="md"
                  h="25px"
                >
                  <NativeSelect.Field
                    h="25px"
                    defaultValue={currentLocale}
                    bg="whiteAlpha.200"
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => changeLang(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Flex>
            </Flex>
            <Flex
              flexFlow={['row']}
              gap={[3, 12]}
              justifyContent="center"
              css={{ '& a:hover': { textDecoration: 'underline' } }}
            >
              {footerColumns.map((column) => (
                <Flex
                  key={column.title}
                  flex="1"
                  flexFlow={'column'}
                  fontSize="xs"
                  gap={2}
                  color="gray.300"
                >
                  <Text fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
                    <b>{column.title}</b>
                  </Text>
                  {column.links.map((link, index) => (
                    <MainLink
                      key={`${column.title}-${link.href}-${index}`}
                      href={link.href}
                      isExternal={link.isExternal}
                      trackEvent="footer-links"
                      trackEventLabel={link.trackEventLabel}
                    >
                      {link.label}
                    </MainLink>
                  ))}
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
