'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import type { IconType } from 'react-icons';
import { LuArrowLeftRight, LuArrowRight, LuListChecks, LuTag } from 'react-icons/lu';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import { useScriptStatus } from '@utils/scriptUtils';
import { TampermonkeyExtraStep } from '@components/UserLists/ChecklistGuide';
import { PriceCheckerPageCard } from '@app/[locale]/tools/price-checker/PriceCheckerPageCard';
import { inventoryPages } from '@app/[locale]/tools/price-checker/priceCheckerPages';
import {
  DYNAMIC_LIST_ACCENT,
  PRICE_CHECKER_ACCENT,
  PRICE_CHECKER_ACCENT_LIGHT,
} from '@app/[locale]/tools/price-checker/priceCheckerTheme';
import { ImportDynamicLists } from './ImportDynamicLists';

const FAQ = ['safe', 'trouble', 'price', 'mobile'] as const;

export function ImportPageClient() {
  const t = useTranslations();
  const locale = useLocale();
  const breadcrumbList = [
    { position: 1, name: t('Layout.home'), item: '/' },
    { position: 2, name: t('Lists.Lists'), item: '/lists/official' },
    { position: 3, name: t('Lists.checklists-and-importing-items'), item: '/lists/import' },
  ];

  return (
    <>
      <HeaderCard
        color={PRICE_CHECKER_ACCENT}
        breadcrumb={<BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />}
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
      >
        <Heading as="h1" size="lg">
          {t('ImportPage.h1')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{t('ImportPage.description')}</Text>
      </HeaderCard>

      <Flex direction="column" gap={{ base: 8, md: 10 }} w="full" maxW="1100px">
        <OutdatedListImporterAlert />
        <GoalPicker />

        <ImportDynamicLists />

        <Box as="section" id="inventory" scrollMarginTop="80px">
          <Text
            color={PRICE_CHECKER_ACCENT_LIGHT}
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
          >
            {t('ImportPage.inventory-eyebrow')}
          </Text>
          <Heading as="h2" size="lg" mt={1}>
            {t('ImportPage.inventory-pages')}
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={1}>
            {t('ImportPage.inventory-hint')}
          </Text>
          <Box mt={1} mb={4}>
            <TampermonkeyExtraStep trackFrom="import-page-inventory" />
          </Box>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {inventoryPages.map((page) => (
              <PriceCheckerPageCard
                key={page.id}
                page={page}
                description={t(`ImportPage.source-${page.id}`)}
                trackEvent="import-page-source"
              />
            ))}
          </SimpleGrid>
        </Box>

        <AdvancedImportCard />

        <Box as="section" css={{ '& a': { color: PRICE_CHECKER_ACCENT_LIGHT } }}>
          <Heading as="h2" size="lg" mb={4}>
            {t('ImportPage.faq-title')}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {FAQ.map((key) => (
              <Box
                key={key}
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                borderRadius="xl"
                bg="whiteAlpha.50"
                p={{ base: 4, md: 5 }}
              >
                <Heading as="h3" size="sm" mb={1}>
                  {t(`ImportPage.faq-${key}-title`)}
                </Heading>
                <Text as="div" fontSize="sm" color="gray.400" lineHeight="1.55">
                  {t.rich(`ImportPage.faq-${key}`, {
                    b: (chunks) => <b>{chunks}</b>,
                    SourceLink: (chunks) => (
                      <Link
                        href="https://github.com/lucca180/itemdb/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {chunks}
                      </Link>
                    ),
                    HelpLink: (chunks) => (
                      <MainLink
                        viaNextLink
                        prefetch={false}
                        href="/articles/help-my-scripts-are-not-working"
                        trackEvent="import-page-guide"
                        trackEventLabel="faq-scripts-not-working"
                      >
                        {chunks}
                      </MainLink>
                    ),
                    PriceCheckerLink: (chunks) => (
                      <MainLink
                        viaNextLink
                        prefetch={false}
                        href="/tools/price-checker"
                        trackEvent="import-page-link"
                        trackEventLabel="price-checker"
                      >
                        {chunks}
                      </MainLink>
                    ),
                  })}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Flex>
    </>
  );
}

type Goal = {
  id: string;
  icon: IconType;
  accent: string;
  href: string;
  /** Section on this page; otherwise another page */
  isAnchor?: boolean;
  isPopular?: boolean;
};

const GOALS: Goal[] = [
  {
    id: 'collections',
    icon: LuListChecks,
    accent: DYNAMIC_LIST_ACCENT,
    href: '#collections',
    isAnchor: true,
    isPopular: true,
  },
  {
    id: 'inventory',
    icon: LuArrowRight,
    accent: PRICE_CHECKER_ACCENT_LIGHT,
    href: '#inventory',
    isAnchor: true,
  },
  { id: 'prices', icon: LuTag, accent: 'blue.300', href: '/tools/price-checker' },
  { id: 'migrate', icon: LuArrowLeftRight, accent: 'gray.300', href: '/lists/import/advanced' },
];

/** "What do you want to do?": each goal jumps to its section or page */
function GoalPicker() {
  const t = useTranslations();

  return (
    <Box as="section">
      <Heading as="h2" size="lg" mb={3}>
        {t('ImportPage.picker-title')}
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={3}>
        {GOALS.map((goal) => {
          const content = (
            <Flex direction="column" gap={2} h="full">
              <Flex justify="space-between" align="center">
                <Icon as={goal.icon} boxSize={5} color={goal.accent} />
                {goal.isPopular && (
                  <Badge size="xs" colorPalette="orange">
                    {t('ImportPage.picker-popular')}
                  </Badge>
                )}
              </Flex>
              <Text fontWeight="bold">{t(`ImportPage.picker-${goal.id}-title`)}</Text>
              <Text fontSize="sm" color="gray.400" lineHeight="1.5">
                {t(`ImportPage.picker-${goal.id}`)}
              </Text>
            </Flex>
          );

          return (
            <Box
              key={goal.id}
              asChild
              p={4}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              bg="whiteAlpha.50"
              transition="all 0.15s"
              _hover={{ bg: 'whiteAlpha.100', borderColor: goal.accent }}
            >
              {goal.isAnchor ? (
                <a
                  href={goal.href}
                  onClick={() => window.umami?.track('import-page-goal', { label: goal.id })}
                >
                  {content}
                </a>
              ) : (
                <MainLink
                  viaNextLink
                  prefetch={false}
                  href={goal.href}
                  trackEvent="import-page-goal"
                  trackEventLabel={goal.id}
                >
                  {content}
                </MainLink>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function AdvancedImportCard() {
  const t = useTranslations();

  return (
    <Flex
      as="section"
      direction={{ base: 'column', md: 'row' }}
      align={{ md: 'center' }}
      justify="space-between"
      gap={4}
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      bg="whiteAlpha.50"
      p={{ base: 4, md: 5 }}
    >
      <Box>
        <Heading as="h2" size="md" mb={1}>
          {t('ImportPage.advanced-title')}
        </Heading>
        <Text fontSize="sm" color="gray.400" lineHeight="1.55">
          {t.rich('ImportPage.advanced-description', { b: (chunks) => <b>{chunks}</b> })}
        </Text>
      </Box>
      <Button asChild size="sm" variant="outline" flexShrink={0}>
        <MainLink
          viaNextLink
          prefetch={false}
          href="/lists/import/advanced"
          trackEvent="import-page-link"
          trackEventLabel="advanced-import"
        >
          {t('ImportPage.advanced-cta')}
          <LuArrowRight />
        </MainLink>
      </Button>
    </Flex>
  );
}

function OutdatedListImporterAlert() {
  const t = useTranslations();
  const { scriptStatus } = useScriptStatus();
  const listImporter = scriptStatus?.itemdb_listImporter;

  if (!listImporter || listImporter?.status !== 'outdated') return null;

  return (
    <Alert.Root
      status="warning"
      variant="surface"
      maxW="750px"
      css={{ '& a': { color: 'colorPalette.100' } }}
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t('Lists.import-outdated-script-title')}</Alert.Title>
        <Alert.Description>
          {t.rich('Lists.import-outdated-script', {
            Link: (chunk) => (
              <Link asChild>
                <MainLink href={listImporter?.link} isExternal>
                  {chunk}
                </MainLink>
              </Link>
            ),
          })}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
