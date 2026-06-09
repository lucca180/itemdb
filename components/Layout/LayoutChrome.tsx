'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import Color from 'color';
import { Center, Flex, Spinner, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { Link } from '@i18n/navigation';
import { useLocale } from 'next-intl';
import mtLogo from '@assets/magnetismo-logo.png';
import brasil from '@assets/icons/brasil.png';
import { DropdownButton, DropdownOption } from '@components/Menus/HeaderDropdown';
import { SearchBar } from '@components/Search/SearchBar';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import { LAYOUT_BASE_COLOR, LayoutFrame } from '@components/Layout/LayoutFrame';
import { LayoutLogoContent } from '@components/Layout/LayoutLogoContent';
import MainLink from '@components/Utils/MainLink';
import type { LayoutFooterColumn, LayoutNavSection } from '@components/Layout/layoutData';
import { localizeInternalHref, type AppLocale } from '@utils/locales';

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

  if (hardNavigation) {
    return (
      <a href={localizeInternalHref('/', locale)} style={{ flex: '0 0 auto' }}>
        <LayoutLogoContent />
      </a>
    );
  }

  return (
    <Link href="/" style={{ flex: '0 0 auto' }}>
      <LayoutLogoContent />
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
  const mainContent = loading ? (
    <Center h="80vh" flexFlow="column" gap={3}>
      <Spinner size="lg" />
      <Text>{loadingLabel}</Text>
    </Center>
  ) : (
    children
  );

  return (
    <LayoutFrame
      siteAlert={siteAlert}
      logo={<LayoutLogo hardNavigation={hardNavigation} />}
      search={search}
      auth={auth}
      navigation={
        <LayoutNavMenu
          mainColor={mainColor}
          sections={navSections}
          hardNavigation={hardNavigation}
        />
      }
      footer={
        <LayoutFooter
          madeInLabel={madeInLabel}
          byLabel={byLabel}
          footerColumns={footerColumns}
          footerActions={footerActions}
          hardNavigation={hardNavigation}
        />
      }
      mainColor={mainColor}
      fullWidth={fullWidth}
    >
      {mainContent}
    </LayoutFrame>
  );
}

/** Client boundaries for modules that pull in auth context. */
export function LayoutSearch() {
  return <SearchBar />;
}

export function LayoutFeedback(props: React.ComponentProps<typeof FeedbackButton>) {
  return <FeedbackButton {...props} />;
}
