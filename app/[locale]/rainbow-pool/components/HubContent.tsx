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
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import { IconLink } from '@components/Utils/IconLink';
import MainLink from '@components/Utils/MainLink';
import { getCachedNow } from '@utils/getCachedNow';
import { petColorSlug } from '@utils/pet-utils';
import { POPULAR_COLOR_NAMES, type RainbowPoolComboTile } from '@utils/petColorTool';
import { buildRainbowPoolLabels } from '../buildRainbowPoolLabels';
import { ComboTile } from './ComboTile';
import { RainbowPoolPicker } from './RainbowPoolPicker';
import { BASE_PATH, RainbowPoolShell } from './RainbowPoolShell';

const OFFICIAL_LINKS = {
  pool: 'https://www.neopets.com/pool/',
  fountain: 'https://www.neopets.com/faerieland/rainbowfountain.phtml',
  lab: 'https://www.neopets.com/lab.phtml',
  premium: 'https://www.neopets.com/premium/',
  festival: 'https://www.neopets.com/faeriefestival/index.phtml',
  stylingStudio: 'https://www.neopets.com/mall/stylingstudio/',
} as const;

function richLink(href: string) {
  const RichLink = (chunks: ReactNode) => (
    <IconLink href={href} isExternal color="teal.200" fontWeight="semibold">
      {chunks}
    </IconLink>
  );
  RichLink.displayName = 'HubRichLink';
  return RichLink;
}

function richInternalLink(href: string) {
  const RichInternalLink = (chunks: ReactNode) => (
    <Link asChild color="teal.200" fontWeight="semibold">
      <MainLink href={href}>{chunks}</MainLink>
    </Link>
  );
  RichInternalLink.displayName = 'HubRichInternalLink';
  return RichInternalLink;
}

const richLinkTags = {
  PoolLink: richLink(OFFICIAL_LINKS.pool),
  FountainLink: richLink(OFFICIAL_LINKS.fountain),
  LabLink: richLink(OFFICIAL_LINKS.lab),
  PremiumLink: richLink(OFFICIAL_LINKS.premium),
  FestivalLink: richLink(OFFICIAL_LINKS.festival),
  StudioLink: richLink(OFFICIAL_LINKS.stylingStudio),
  StylesLink: richInternalLink('/rainbow-pool/pet-styles'),
};

/** Plain text for FAQPage JSON-LD (strip next-intl rich tags). */
function stripRichTags(value: string): string {
  return value.replace(/<\/?[A-Za-z][A-Za-z0-9]*>/g, '');
}

type HubFaqItem = {
  questionName: string;
  acceptedAnswerText: string;
  acceptedAnswer: ReactNode;
};

function formatFaqPageJsonLd(items: HubFaqItem[]) {
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

type HubContentProps = {
  locale: string;
  colors: string[];
  species: string[];
  recentlyReleased: RainbowPoolComboTile[];
};

export async function HubContent({ locale, colors, species, recentlyReleased }: HubContentProps) {
  const [t, labels, formatter, now] = await Promise.all([
    getTranslations(),
    buildRainbowPoolLabels(),
    getFormatter(),
    getCachedNow(),
  ]);

  const popularColors = POPULAR_COLOR_NAMES.map((name) => ({
    name,
    href: `${BASE_PATH}/${petColorSlug(name)}`,
  }));

  const hubSections = [
    {
      title: t('PetColors.hub-section-what-title'),
      body: t.rich('PetColors.hub-section-what-body', richLinkTags),
    },
    {
      title: t('PetColors.hub-section-diff-title'),
      body: t.rich('PetColors.hub-section-diff-body', richLinkTags),
    },
    {
      title: t('PetColors.hub-section-alt-title'),
      body: t.rich('PetColors.hub-section-alt-body', richLinkTags),
    },
  ];

  const faqItems: HubFaqItem[] = [1, 2, 3, 4, 5].map((i) => ({
    questionName: t(`PetColors.faq-${i}`),
    acceptedAnswerText: stripRichTags(t.raw(`PetColors.faq-${i}-text`)),
    acceptedAnswer: t.rich(`PetColors.faq-${i}-text`, richLinkTags),
  }));
  const faqJsonLd = formatFaqPageJsonLd(faqItems);

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={createPoolBreadcrumbList(t)} locale={locale} />

      <Center flexFlow="column" gap={3} textAlign="center" mt={4} mb={8}>
        <Text fontSize="sm" color="whiteAlpha.700" letterSpacing="0.04em" textTransform="uppercase">
          {labels.eyebrowLabel}
        </Text>
        <Heading as="h1" size="2xl">
          {labels.toolTitle}
        </Heading>
        <Text maxW="640px" color="whiteAlpha.900" css={{ textWrap: 'pretty' }}>
          {labels.cta}
        </Text>
        <RainbowPoolPicker
          colors={colors}
          species={species}
          selectColorLabel={labels.selectColorLabel}
          selectSpeciesLabel={labels.selectSpeciesLabel}
          searchLabel={labels.searchLabel}
        />
        <Link asChild fontSize="sm" color="cyan.200" fontWeight="semibold" mt={1}>
          <MainLink href="/rainbow-pool/pet-styles">
            {t('PetColors.pet-styles-browse-cta')}
          </MainLink>
        </Link>
      </Center>

      <VStack align="stretch" gap={8} maxW="1100px" mx="auto" px={2}>
        {recentlyReleased.length > 0 && (
          <Box>
            <Flex justify="space-between" align="baseline" mb={3} gap={2} flexWrap="wrap">
              <Heading as="h2" size="md">
                {labels.recentlyReleasedTitle}
              </Heading>
            </Flex>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
              {recentlyReleased.map((combo) => (
                <ComboTile
                  key={combo.href}
                  combo={combo}
                  releasedLabel={formatter.relativeTime(combo.addedAt, now)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Box>
          <Heading as="h2" size="md" mb={3}>
            {labels.popularColorsTitle}
          </Heading>
          <Flex flexWrap="wrap" gap={2}>
            {popularColors.map((color) => (
              <Link
                key={color.name}
                asChild
                px={3}
                py={1.5}
                borderRadius="full"
                bg="blackAlpha.500"
                fontSize="sm"
                _hover={{ bg: 'blackAlpha.700' }}
              >
                <MainLink href={color.href}>{color.name}</MainLink>
              </Link>
            ))}
          </Flex>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={3}>
            {labels.howItWorksTitle}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            {labels.howItWorksSteps.map((step, i) => (
              <Flex
                key={step}
                gap={3}
                p={3}
                bg="blackAlpha.400"
                borderRadius="lg"
                align="flex-start"
              >
                <Text fontWeight="bold" color="teal.200">
                  {i + 1}.
                </Text>
                <Text fontSize="sm">{step}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>

        <Separator borderColor="whiteAlpha.200" />

        <VStack align="stretch" gap={6}>
          {hubSections.map((section) => (
            <Box key={section.title}>
              <Heading as="h2" size="md" mb={2}>
                {section.title}
              </Heading>
              <Text color="whiteAlpha.800" css={{ textWrap: 'pretty' }}>
                {section.body}
              </Text>
            </Box>
          ))}
        </VStack>

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
