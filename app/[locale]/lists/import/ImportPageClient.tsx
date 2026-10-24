'use client';

import { Alert, Box, Button, Flex, Heading, Link, SimpleGrid, Text } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { LuArrowRight } from 'react-icons/lu';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import { useScriptStatus } from '@utils/scriptUtils';
import { PriceCheckerPageCard } from '@app/[locale]/tools/price-checker/PriceCheckerPageCard';
import { inventoryPages } from '@app/[locale]/tools/price-checker/priceCheckerPages';
import {
  PRICE_CHECKER_ACCENT,
  PRICE_CHECKER_ACCENT_LIGHT,
} from '@app/[locale]/tools/price-checker/priceCheckerTheme';
import { ImportDynamicLists } from './ImportDynamicLists';
import { ImportHowItWorks } from './ImportHowItWorks';

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
        <ImportHowItWorks />

        <Box as="section">
          <Text
            color={PRICE_CHECKER_ACCENT_LIGHT}
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
          >
            {t('ImportPage.choose-source')}
          </Text>
          <Heading as="h2" size="lg" mt={1}>
            {t('ImportPage.inventory-pages')}
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={1} mb={4}>
            {t('ImportPage.inventory-hint')}
          </Text>
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

        <ImportDynamicLists />

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
