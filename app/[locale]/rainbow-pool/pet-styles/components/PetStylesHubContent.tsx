import {
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import { IconLink } from '@components/Utils/IconLink';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import type { StudioEssentialItem } from '@app/server/petStyles';
import type { StyleComboTile, StyleToken } from '@utils/petStyles/display';
import { STYLES_BASE_PATH } from '@utils/petStyles/paths';
import { getTranslations } from 'next-intl/server';
import { ComboTile } from '../../components/ComboTile';
import { BASE_PATH, RainbowPoolShell } from '../../components/RainbowPoolShell';
import { HubResultsGrid, PetStylesSearchBar } from './PetStylesSearchBar';

const OFFICIAL_LINKS = {
  stylingStudio: 'https://www.neopets.com/mall/stylingstudio/',
} as const;

function richLink(href: string) {
  const RichLink = (chunks: ReactNode) => (
    <IconLink href={href} isExternal color="teal.200" fontWeight="semibold">
      {chunks}
    </IconLink>
  );
  RichLink.displayName = 'PetStylesRichLink';
  return RichLink;
}

/** Chamber has no stable public URL (login nav only) — emphasize in copy without a bad link. */
function richStrong(chunks: ReactNode) {
  return (
    <Text as="span" fontWeight="semibold" color="whiteAlpha.900">
      {chunks}
    </Text>
  );
}

function richPoolLink(chunks: ReactNode) {
  return (
    <Link asChild color="teal.200" fontWeight="semibold">
      <MainLink href={BASE_PATH}>{chunks}</MainLink>
    </Link>
  );
}

function richItemLink(slug: string | undefined) {
  if (!slug) return richStrong;
  const ItemRichLink = (chunks: ReactNode) => (
    <Link asChild color="teal.200" fontWeight="semibold">
      <MainLink href={`/item/${slug}`}>{chunks}</MainLink>
    </Link>
  );
  ItemRichLink.displayName = 'PetStylesItemRichLink';
  return ItemRichLink;
}

function stripRichTags(value: string): string {
  return value.replace(/<\/?[A-Za-z][A-Za-z0-9]*>/g, '');
}

type FaqItem = {
  questionName: string;
  acceptedAnswerText: string;
  acceptedAnswer: ReactNode;
};

function formatFaqPageJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.questionName,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.acceptedAnswerText,
      },
    })),
  };
}

type PetStylesHubContentProps = {
  locale: string;
  colors: string[];
  species: string[];
  seriesOptions: string[];
  tokens: StyleToken[];
  total: number;
  page: number;
  pageSize: number;
  recentCombos: StyleComboTile[];
  studioItems: StudioEssentialItem[];
  seriesName?: string;
  prismatic?: boolean;
  availableNow?: boolean;
};

export async function PetStylesHubContent({
  locale,
  colors,
  species,
  seriesOptions,
  tokens,
  total,
  page,
  pageSize,
  recentCombos,
  studioItems,
  seriesName = '',
  prismatic = false,
  availableNow = false,
}: PetStylesHubContentProps) {
  const t = await getTranslations();
  const hasActiveFilter = Boolean(seriesName || prismatic || availableNow);
  const isPageDefault = !hasActiveFilter;

  const breadcrumbList = createPoolBreadcrumbList(
    (key) => t(key),
    [{ name: t('PetStyles.breadcrumb'), item: STYLES_BASE_PATH }]
  );

  const suppliesSlug = studioItems.find((item) => item.name === 'Styling Studio Supplies')?.slug;
  const deluxeSuppliesSlug = studioItems.find(
    (item) => item.name === 'Deluxe Styling Studio Supplies'
  )?.slug;

  const richLinkTags = {
    StudioLink: richLink(OFFICIAL_LINKS.stylingStudio),
    ChamberLink: richStrong,
    PoolLink: richPoolLink,
    SuppliesLink: richItemLink(suppliesSlug),
    DeluxeSuppliesLink: richItemLink(deluxeSuppliesSlug),
  };

  const faqItems: FaqItem[] = [1, 2, 3, 4, 5].map((i) => ({
    questionName: t(`PetStyles.faq-${i}`),
    acceptedAnswerText: stripRichTags(t.raw(`PetStyles.faq-${i}-text`)),
    acceptedAnswer: t.rich(`PetStyles.faq-${i}-text`, richLinkTags),
  }));
  const faqJsonLd = formatFaqPageJsonLd(faqItems);

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={breadcrumbList} locale={locale} />

      <Center flexFlow="column" gap={3} textAlign="center" mt={4} mb={8}>
        <Text fontSize="sm" color="whiteAlpha.700" letterSpacing="0.04em" textTransform="uppercase">
          {t('PetStyles.eyebrow')}
        </Text>
        <Heading as="h1" size="2xl">
          {t('PetStyles.hub-h1')}
        </Heading>
        <Text maxW="640px" color="whiteAlpha.900" css={{ textWrap: 'pretty' }}>
          {t('PetStyles.hub-lede')}
        </Text>
        <PetStylesSearchBar
          colors={colors}
          species={species}
          seriesOptions={seriesOptions}
          initialSeries={seriesName}
          initialPrismatic={prismatic}
          initialAvailableNow={availableNow}
          isPageDefault={isPageDefault}
        />
      </Center>

      <VStack align="stretch" gap={8} maxW="1100px" mx="auto" px={2} pb={8}>
        <Box>
          <Flex justify="space-between" align="baseline" mb={3} gap={2} flexWrap="wrap">
            <Heading as="h2" size="md">
              {hasActiveFilter ? t('PetStyles.search-results') : t('PetColors.recently-released')}
            </Heading>
            <Link asChild fontSize="sm" color="teal.200">
              <MainLink href={BASE_PATH}>{t('PetStyles.paint-paths')}</MainLink>
            </Link>
          </Flex>
          <HubResultsGrid
            tokens={tokens}
            total={total}
            page={page}
            pageSize={pageSize}
            pathname={STYLES_BASE_PATH}
            seriesName={seriesName}
            prismatic={prismatic}
            availableNow={availableNow}
            showRange={hasActiveFilter}
          />
        </Box>

        {isPageDefault && recentCombos.length > 0 && (
          <Box>
            <Heading as="h2" size="md" mb={3}>
              {t('PetStyles.combos-with-styles')}
            </Heading>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
              {recentCombos.map((combo) => (
                <ComboTile
                  key={combo.href}
                  combo={{
                    speciesId: combo.speciesId,
                    colorId: combo.colorId,
                    speciesName: combo.speciesName,
                    colorName: combo.colorName,
                    previewUrl: combo.previewUrl,
                    href: combo.href,
                    addedAt: combo.addedAt,
                  }}
                  releasedLabel={t('PetStyles.styles-count', { count: combo.styleCount })}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {studioItems.length > 0 && (
          <Box>
            <Heading as="h2" size="md" mb={1}>
              {t('PetStyles.supplies-title')}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.800" mb={4} css={{ textWrap: 'pretty' }}>
              {t('PetStyles.supplies-sub')}
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3}>
              {studioItems.map((item) => (
                <Link
                  key={item.slug}
                  asChild
                  p={3}
                  borderRadius="lg"
                  bg="blackAlpha.400"
                  _hover={{ bg: 'blackAlpha.600', textDecoration: 'none' }}
                >
                  <MainLink href={`/item/${item.slug}`}>
                    <Flex gap={3} align="center">
                      <Box
                        w="64px"
                        h="64px"
                        flexShrink={0}
                        borderRadius="md"
                        bg="blackAlpha.500"
                        overflow="hidden"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          unoptimized
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                      <Box minW={0}>
                        <Text fontWeight="semibold" fontSize="sm" lineClamp={2}>
                          {item.name}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="whiteAlpha.700"
                          mt={1}
                          css={{ textWrap: 'pretty' }}
                        >
                          {t.rich(`PetStyles.${item.blurbKey}`, {
                            b: (chunks) => (
                              <Text as="span" fontWeight="bold" color="whiteAlpha.900">
                                {chunks}
                              </Text>
                            ),
                          })}
                        </Text>
                      </Box>
                    </Flex>
                  </MainLink>
                </Link>
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Separator borderColor="whiteAlpha.200" />

        <Box>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
          <Heading as="h2" size="md" mb={4}>
            {t('PetColors.faq-title')}
          </Heading>
          <VStack align="stretch" gap={4}>
            {faqItems.map((item) => (
              <Box key={item.questionName}>
                <Heading as="h3" size="sm" mb={1}>
                  {item.questionName}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.800" css={{ textWrap: 'pretty' }}>
                  {item.acceptedAnswer}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </RainbowPoolShell>
  );
}
