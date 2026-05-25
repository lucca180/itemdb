import type { ReactNode } from 'react';
import Color from 'color';
import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { cookies, headers } from 'next/headers';
import NextImage from 'next/image';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import logo from '@assets/logo_white_compressed.svg';
import logoIcon from '@assets/logo_icon.svg';
import mtLogo from '@assets/magnetismo-logo.png';
import brasil from '@assets/icons/brasil.png';
import { appLoadTranslation } from '@utils/load-translation';
import { AppSiteAlert } from './AppSiteAlert';
import { LayoutAuthIsland } from './LayoutAuthIsland';
import { LayoutFeedbackIsland } from './LayoutFeedbackIsland';
import { LayoutLocaleIsland } from './LayoutLocaleIsland';
import { LayoutNavMenuIsland } from './LayoutNavMenuIsland';
import { LayoutSearchIsland } from './LayoutSearchIsland';
import {
  getLayoutFooterColumns,
  getLayoutNavSections,
  type LayoutFooterColumn,
} from '@components/Layout/layoutData';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { redirect } from 'next/navigation';

type AppServerLayoutProps = {
  children?: ReactNode;
  loading?: boolean;
  disableNextSeo?: boolean;
  mainColor?: string;
  fullWidth?: boolean;
};

export default async function AppServerLayout(props: AppServerLayoutProps) {
  const locale = await getLocale();
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get('x-itemdb-current-path') ?? '/';
  const messages = await appLoadTranslation(locale);
  const t = createTranslator({ messages, locale });
  const color = Color('#4A5568');
  const rgb = color.rgb().round().array();

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const { user } = sessionCookie ? await getServerCurrentUser() : { user: null };

  if (user && !user.username && !currentPath.includes('/login')) {
    redirect('/login');
  }

  const translate = (key: string) => t(key);
  const navSections = getLayoutNavSections(translate);
  const footerColumns = getLayoutFooterColumns(translate);

  return (
    <Flex flexFlow="column" minH="100vh">
      <AppSiteAlert locale={locale} />
      <Flex
        as="header"
        w="full"
        maxW="8xl"
        marginX="auto"
        gap={{ base: 2, md: 4 }}
        px={{ base: 2, md: 4 }}
        py={5}
      >
        <Link prefetch={false} href="/" style={{ flex: '0 0 auto' }}>
          <Box display={{ base: 'inline', md: 'none' }}>
            <NextImage
              src={logoIcon}
              alt="itemdb logo"
              height={50}
              style={{ width: 'auto', maxHeight: '50px' }}
            />
          </Box>
          <Box display={{ base: 'none', md: 'inline' }}>
            <NextImage src={logo} alt="itemdb logo" width={175} />
          </Box>
        </Link>
        <Flex flex="1 1 auto" justifyContent="center" alignItems="center">
          <Box maxW="650px" h="100%" flex="1">
            <LayoutSearchIsland />
          </Box>
        </Flex>
        <LayoutAuthIsland initialUser={user} />
      </Flex>

      <Flex
        style={{ background: props.mainColor }}
        justifyContent="center"
        alignItems="center"
        py={1}
        gap={{ base: 1, md: 3 }}
      >
        <LayoutNavMenuIsland mainColor={props.mainColor} sections={navSections} />
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
        p={3}
        pt={10}
        mt={8}
        style={{
          backgroundImage: `linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`,
        }}
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
            flexFlow="column"
            textAlign={['center', 'center', 'right']}
            gap={4}
            justifyContent="center"
            alignItems={['center', 'center', 'flex-end']}
          >
            <Link href="https://magnetismotimes.com/" target="_blank">
              <NextImage src={mtLogo} width={202} height={50} alt="Magnetismo Times logo" />
            </Link>
            <Text as="p" fontSize="xs" color="gray.500" position="relative">
              {t('Layout.made-in')}{' '}
              <NextImage
                src={brasil}
                alt="Brasil Flag"
                width={18}
                style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
              />{' '}
              {t('Layout.by')}{' '}
              <Link href="https://magnetismotimes.com/" target="_blank">
                Magnetismo Times
              </Link>
              <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
              permission.
            </Text>
            <Flex alignItems="flex-end" gap={4}>
              <LayoutFeedbackIsland
                bg="whiteAlpha.200"
                variant="solid"
                size="xs"
                flex="1"
                h="25px"
                borderRadius="md"
              />
              <LayoutLocaleIsland locale={locale} currentPath={currentPath} />
            </Flex>
          </Flex>

          <Flex
            flexFlow="row"
            gap={[3, 12]}
            justifyContent="center"
            css={{ '& a:hover': { textDecoration: 'underline' } }}
          >
            {footerColumns.map((column) => (
              <FooterColumn key={column.title} column={column} />
            ))}
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}

type FooterColumnProps = {
  column: LayoutFooterColumn;
};

function FooterColumn({ column }: FooterColumnProps) {
  return (
    <Flex flex="1" flexFlow="column" fontSize="xs" gap={2} color="gray.300">
      <Text as="p" fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
        <b>{column.title}</b>
      </Text>
      {column.links.map((link, index) => (
        <Link
          key={`${link.href}-${index}`}
          href={link.href}
          target={link.isExternal ? '_blank' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </Flex>
  );
}
