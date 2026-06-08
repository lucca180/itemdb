'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import Color from 'color';
import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { Link } from '@i18n/navigation';
import { useLocale } from 'next-intl';
import logo from '@assets/logo_white_compressed.svg';
import logoIcon from '@assets/logo_icon.svg';
import mtLogo from '@assets/magnetismo-logo.png';
import brasil from '@assets/icons/brasil.png';
import { DropdownButton, DropdownOption } from '@components/Menus/HeaderDropdown';
import { SearchBar } from '@components/Search/SearchBar';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import MainLink from '@components/Utils/MainLink';
import type { LayoutFooterColumn, LayoutNavSection } from '@components/Layout/layoutData';
import { localizeInternalHref, type AppLocale } from '@utils/locales';

const LAYOUT_BASE_COLOR = '#4A5568';

const noopSubscribe = () => () => {};

function useCopyrightYear() {
  return useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );
}

export type LayoutChromeProps = {
  children?: ReactNode;
  loading?: boolean;
  loadingLabel: string;
  mainColor?: string;
  fullWidth?: boolean;
  navSections: LayoutNavSection[];
  footerColumns: LayoutFooterColumn[];
  madeInLabel: string;
  byLabel: string;
  siteAlert: ReactNode;
  search: ReactNode;
  auth: ReactNode;
  footerActions: ReactNode;
  hardNavigation?: boolean;
};

function getLayoutFooterGradientRgb() {
  return Color(LAYOUT_BASE_COLOR).rgb().round().array();
}

function LayoutLogo({ hardNavigation }: { hardNavigation?: boolean }) {
  const locale = useLocale() as AppLocale;
  const content = (
    <>
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
    </>
  );

  if (hardNavigation) {
    return (
      <a href={localizeInternalHref('/', locale)} style={{ flex: '0 0 auto' }}>
        {content}
      </a>
    );
  }

  return (
    <Link href="/" style={{ flex: '0 0 auto' }}>
      {content}
    </Link>
  );
}

function LayoutNavMenu({
  mainColor,
  sections,
  hardNavigation,
}: {
  mainColor?: string;
  sections: LayoutNavSection[];
  hardNavigation?: boolean;
}) {
  return (
    <>
      {sections.map((section) => (
        <DropdownButton
          key={section.href}
          bg={section.options?.length ? mainColor : undefined}
          label={section.label}
          href={section.href}
          hardNavigation={hardNavigation}
        >
          {section.options?.map((option, index) => (
            <DropdownOption
              key={`${section.href}-${option.href}-${index}`}
              label={option.label}
              href={option.href}
              newUntil={option.newUntil}
              hardNavigation={hardNavigation}
            />
          ))}
        </DropdownButton>
      ))}
    </>
  );
}

function LayoutFooterColumns({
  columns,
  hardNavigation,
}: {
  columns: LayoutFooterColumn[];
  hardNavigation?: boolean;
}) {
  return (
    <>
      {columns.map((column) => (
        <Flex key={column.title} flex="1" flexFlow="column" fontSize="xs" gap={2} color="gray.300">
          <Text as="p" fontSize="xs" mb={2} textTransform="uppercase" color="gray.500">
            <b>{column.title}</b>
          </Text>
          {column.links.map((link, index) => (
            <MainLink
              key={`${column.title}-${link.href}-${index}`}
              href={link.href}
              isExternal={link.isExternal}
              trackEvent="footer-links"
              trackEventLabel={link.trackEventLabel}
              hardNavigation={hardNavigation}
            >
              {link.label}
            </MainLink>
          ))}
        </Flex>
      ))}
    </>
  );
}

function LayoutFooter({
  madeInLabel,
  byLabel,
  footerColumns,
  footerActions,
  hardNavigation,
}: {
  madeInLabel: string;
  byLabel: string;
  footerColumns: LayoutFooterColumn[];
  footerActions: ReactNode;
  hardNavigation?: boolean;
}) {
  const copyrightYear = useCopyrightYear();
  const rgb = getLayoutFooterGradientRgb();

  return (
    <Flex
      as="footer"
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
          flexFlow="column"
          textAlign={['center', 'center', 'right']}
          gap={4}
          justifyContent="center"
          alignItems={['center', 'center', 'flex-end']}
        >
          <MainLink href="https://magnetismotimes.com/" isExternal>
            <NextImage src={mtLogo} width={202} height={50} alt="Magnetismo Times logo" />
          </MainLink>
          <Text as="p" fontSize="xs" color="gray.500" position="relative">
            {madeInLabel}{' '}
            <NextImage
              src={brasil}
              alt="Brasil Flag"
              width={18}
              style={{ display: 'inline', verticalAlign: 'middle', margin: '0 0px' }}
            />{' '}
            {byLabel}{' '}
            <MainLink href="https://magnetismotimes.com/" isExternal>
              Magnetismo Times
            </MainLink>
            <br />© 1999-{copyrightYear} NeoPets, Inc. All rights reserved. Used with permission.
          </Text>
          <Flex alignItems="flex-end" gap={4}>
            {footerActions}
          </Flex>
        </Flex>

        <Flex
          flexFlow="row"
          gap={[3, 12]}
          justifyContent="center"
          css={{ '& a:hover': { textDecoration: 'underline' } }}
        >
          <LayoutFooterColumns columns={footerColumns} hardNavigation={hardNavigation} />
        </Flex>
      </Flex>
    </Flex>
  );
}

export function LayoutChrome({
  children,
  loading,
  loadingLabel,
  mainColor,
  fullWidth,
  navSections,
  footerColumns,
  madeInLabel,
  byLabel,
  siteAlert,
  search,
  auth,
  footerActions,
  hardNavigation,
}: LayoutChromeProps) {
  return (
    <Flex flexFlow="column" minH="100vh">
      {siteAlert}
      <Flex
        as="header"
        w="full"
        maxW="8xl"
        marginX="auto"
        gap={{ base: 2, md: 4 }}
        px={{ base: 2, md: 4 }}
        py={5}
      >
        <LayoutLogo hardNavigation={hardNavigation} />
        <Flex flex="1 1 auto" justifyContent="center" alignItems="center">
          <Box maxW="650px" h="100%" flex="1">
            {search}
          </Box>
        </Flex>
        {auth}
      </Flex>

      <Flex
        as="nav"
        bg={mainColor}
        justifyContent="center"
        alignItems="center"
        py={1}
        gap={{ base: 1, md: 3 }}
        overflowX="auto"
      >
        <Flex margin="0 auto" maxW="100%" alignItems="center" py={1} gap={{ base: 1, md: 3 }}>
          <LayoutNavMenu
            mainColor={mainColor}
            sections={navSections}
            hardNavigation={hardNavigation}
          />
        </Flex>
      </Flex>

      <Box
        as="main"
        flex="1"
        w="full"
        maxW={fullWidth ? undefined : '8xl'}
        marginX="auto"
        px={fullWidth ? undefined : 4}
        pb={6}
        h="100%"
      >
        {!loading && children}
        {loading && (
          <Center h="80vh" flexFlow="column" gap={3}>
            <Spinner size="lg" />
            <Text>{loadingLabel}</Text>
          </Center>
        )}
      </Box>

      <LayoutFooter
        madeInLabel={madeInLabel}
        byLabel={byLabel}
        footerColumns={footerColumns}
        footerActions={footerActions}
        hardNavigation={hardNavigation}
      />
    </Flex>
  );
}

/** Client boundaries for modules that pull in auth context. */
export function LayoutSearch() {
  return <SearchBar />;
}

export function LayoutFeedback(props: React.ComponentProps<typeof FeedbackButton>) {
  return <FeedbackButton {...props} />;
}
