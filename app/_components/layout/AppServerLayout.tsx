import type { ReactNode } from 'react';
import Color from 'color';
import { Flex, styled } from '@styled/jsx';
import { headers } from 'next/headers';
import NextImage from 'next/image';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import logo from '@assets/logo_white_compressed.svg';
import logoIcon from '@assets/logo_icon.svg';
import mtLogo from '@assets/magnetismo-logo.png';
import brazil from '@assets/icons/brazil.png';
import { appLoadTranslation } from '@utils/load-translation';
import { AppSiteAlert } from './AppSiteAlert';
import { LayoutAuthIsland } from './LayoutAuthIsland';
import { LayoutFeedbackIsland } from './LayoutFeedbackIsland';
import { LayoutLocaleIsland } from './LayoutLocaleIsland';
import { LayoutNavMenuIsland } from './LayoutNavMenuIsland';
import { LayoutSearchIsland } from './LayoutSearchIsland';
import type { LayoutNavSection } from './layoutUtils';

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

  const navSections: LayoutNavSection[] = [
    { label: t('Layout.home'), href: '/' },
    {
      label: t('Layout.articles'),
      href: '/articles',
      options: [
        { label: t('Layout.userscripts'), href: '/articles/userscripts' },
        { label: 'The Void Within', href: '/hub/the-void-within' },
        { label: t('Layout.patch-notes'), href: '/articles' },
        { label: t('Layout.how-to-contribute'), href: '/contribute' },
        { label: t('Layout.sort-galleries-by-color'), href: '/articles/sort-gallery' },
        {
          label: t('Layout.advanced-search-queries'),
          href: '/articles/advanced-search-queries',
        },
      ],
    },
    {
      label: t('Layout.restock'),
      href: '/restock',
      options: [
        { label: t('Layout.restock-dashboard'), href: '/restock/dashboard' },
        { label: 'Neopian Fresh Foods', href: '/restock/neopian-fresh-foods' },
        { label: "Cog's Tog", href: '/restock/cogs-togs' },
        {
          label: t('Restock.restock-history'),
          href: '/restock/neopian-fresh-foods/history',
        },
        { label: t('Layout.view-all-shops'), href: '/restock/' },
      ],
    },
    {
      label: t('Lists.Lists'),
      href: '/lists/official',
      options: [
        { label: t('Layout.import-items-and-checklists'), href: '/lists/import' },
        { label: t('Layout.dailies-and-freebies'), href: '/lists/official/cat/dailies' },
        {
          label: t('Layout.exclusive-clothes'),
          href: '/hub/outfits/aisha',
          newUntil: 1748735999000,
        },
        { label: t('General.dynamic-lists'), href: '/articles/checklists-and-dynamic-lists' },
        { label: t('HomePage.leaving-nc-mall'), href: '/mall/leaving' },
        { label: 'Quest Log', href: '/lists/official/cat/quest-log' },
        { label: t('Layout.all-official-lists'), href: '/lists/official' },
      ],
    },
    {
      label: t('Layout.tools'),
      href: '/tools/rainbow-pool',
      options: [
        { label: t('Layout.sdb-pricer'), href: '/articles/userscripts' },
        { label: t('Layout.userscripts'), href: '/articles/userscripts' },
        { label: t('Layout.rainbow-pool-tool'), href: '/tools/rainbow-pool' },
        { label: t('Layout.item-effects'), href: '/hub/item-effects' },
        { label: t('Layout.restock-dashboard'), href: '/restock/dashboard' },
        { label: t('Calculator.pricing-calculator'), href: '/tools/price-calculator' },
      ],
    },
    {
      label: t('Layout.contribute'),
      href: '/contribute',
      options: [
        { label: 'Item Data Extractor', href: '/contribute' },
        { label: t('Layout.missing-info-hub'), href: '/hub/missing-info' },
        { label: t('Layout.trade-pricing'), href: '/feedback/trades' },
        { label: t('Feedback.suggestion-voting'), href: '/feedback/vote' },
        { label: t('Layout.feedback-and-ideas'), href: '/feedback' },
        { label: t('Layout.report-your-nc-trades'), href: '/mall/report' },
      ],
    },
  ];

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
          <styled.div display={{ base: 'inline', md: 'none' }}>
            <NextImage
              src={logoIcon}
              alt="itemdb logo"
              height={50}
              style={{ width: 'auto', maxHeight: '50px' }}
            />
          </styled.div>
          <styled.div display={{ base: 'none', md: 'inline' }}>
            <NextImage src={logo} alt="itemdb logo" width={175} />
          </styled.div>
        </Link>
        <Flex flex="1 1 auto" justifyContent="center" alignItems="center">
          <styled.div maxW="650px" h="100%" flex="1">
            <LayoutSearchIsland />
          </styled.div>
        </Flex>
        <LayoutAuthIsland />
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

      <styled.main
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
          <Flex h="80vh" flexFlow="column" gap={3} justifyContent="center" alignItems="center">
            <styled.div
              w="40px"
              h="40px"
              borderWidth="4px"
              borderStyle="solid"
              borderColor="whiteAlpha.400"
              borderTopColor="transparent"
              borderRadius="full"
              animation="spin"
            />
            <styled.p>{t('Layout.loading')}</styled.p>
          </Flex>
        )}
      </styled.main>

      <styled.footer
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
            <styled.p fontSize="xs" color="gray.500" position="relative">
              {t('Layout.made-in')}{' '}
              <NextImage
                src={brazil}
                alt="Brazil Flag"
                width={18}
                style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
              />{' '}
              {t('Layout.by')}{' '}
              <Link href="https://magnetismotimes.com/" target="_blank">
                Magnetismo Times
              </Link>
              <br />© 1999-{new Date().getFullYear()} NeoPets, Inc. All rights reserved. Used with
              permission.
            </styled.p>
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
            <FooterColumn
              title={t('Layout.resources')}
              links={[
                { label: 'Lebron', href: '/articles/lebron' },
                { label: t('Layout.devs'), href: 'https://docs.itemdb.com.br', isExternal: true },
                { label: t('Layout.official-lists'), href: '/lists/official' },
                { label: t('Layout.userscripts'), href: '/articles/userscripts' },
                { label: t('Layout.public-data'), href: '/public-data' },
              ]}
            />
            <FooterColumn
              title={t('Layout.contribute')}
              links={[
                { label: 'Item Data Extractor', href: '/contribute' },
                { label: t('Feedback.vote-suggestions'), href: '/feedback/vote' },
                { label: t('Layout.trade-pricing'), href: '/feedback/trades' },
                { label: `+ ${t('Layout.more')}`, href: '/contribute' },
              ]}
            />
            <FooterColumn
              title="itemdb"
              links={[
                { label: `${t('Layout.privacy-policy')} (Feb 2026)`, href: '/privacy' },
                { label: t('Layout.terms-of-use'), href: '/terms' },
                { label: t('Feedback.contact-us'), href: '/feedback' },
                {
                  label: t('Layout.source-code'),
                  href: 'https://github.com/lucca180/itemdb/',
                  isExternal: true,
                },
              ]}
            />
          </Flex>
        </Flex>
      </styled.footer>
    </Flex>
  );
}

type FooterColumnProps = {
  title: string;
  links: Array<{ label: string; href: string; isExternal?: boolean }>;
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <Flex flex="1" flexFlow="column" fontSize="xs" gap={2} color="gray.300">
      <styled.p fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
        <b>{title}</b>
      </styled.p>
      {links.map((link, index) => (
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
