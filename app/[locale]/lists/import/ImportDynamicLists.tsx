'use client';

import { Box, Button, Flex, Heading, Icon, Image, SimpleGrid, Text } from '@chakra-ui/react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { LuArrowRight } from 'react-icons/lu';
import DynamicIcon from '@assets/icons/dynamic.png';
import MainLink from '@components/Utils/MainLink';
import { GOAL_SIZES, goalSampleImagePath, type GoalConfig } from '@utils/goalCounter/config';
import { PREVIEW_BACKGROUNDS } from '@utils/goalCounter/previewSurfaces';
import {
  GOALS_ACCENT,
  GOALS_ACCENT_LIGHT,
  GoalCounterIcon,
  goalsAccentAlpha,
} from '@utils/goalCounter/theme';
import { PriceCheckerPageCard } from '@app/[locale]/tools/price-checker/PriceCheckerPageCard';
import { checklistPages } from '@app/[locale]/tools/price-checker/priceCheckerPages';
import {
  DYNAMIC_LIST_ACCENT,
  DYNAMIC_LIST_ACCENT_LIGHT,
  DYNAMIC_LIST_ACCENT_RGB,
} from '@app/[locale]/tools/price-checker/priceCheckerTheme';
import {
  ChecklistAutoUpdateBanner,
  ChecklistHowToTabs,
} from '@components/UserLists/ChecklistGuide';

const GOAL_SAMPLES: { sample: string; config: GoalConfig; alt: string }[] = [
  { sample: 'stamps-220', config: { variant: 'mosaic', bg: 'transparent' }, alt: 'Stamp album' },
  {
    sample: 'stamps-220',
    config: { variant: 'stamp-classic', bg: 'transparent' },
    alt: 'Stamp album progress',
  },
  {
    sample: 'gourmet-food',
    config: { variant: 'classic-trophy', bg: 'transparent' },
    alt: 'Gourmet Food progress',
  },
];

const eyebrowProps = {
  color: DYNAMIC_LIST_ACCENT_LIGHT,
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
} as const;

function GoalCounterShowcase() {
  const t = useTranslations();

  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      gap={5}
      align={{ md: 'center' }}
      borderWidth="1px"
      borderColor={goalsAccentAlpha(0.45)}
      borderRadius="lg"
      bg={`linear-gradient(145deg, ${goalsAccentAlpha(0.16)}, ${goalsAccentAlpha(0.03)})`}
      p={{ base: 4, md: 5 }}
    >
      <Flex direction="column" gap={2} flex="1" align="flex-start">
        <Heading as="h3" size="md" display="flex" alignItems="center" gap={2}>
          <Icon as={GoalCounterIcon} color={GOALS_ACCENT_LIGHT} />
          {t('ImportPage.goal-title')}
        </Heading>
        <Text fontSize="sm" color="gray.300" lineHeight="1.55">
          {t('ImportPage.goal-description')}
        </Text>
        <Button
          asChild
          size="sm"
          variant="outline"
          mt={1}
          borderColor={GOALS_ACCENT}
          color={GOALS_ACCENT_LIGHT}
          _hover={{ bg: goalsAccentAlpha(0.15) }}
        >
          <MainLink
            viaNextLink
            prefetch={false}
            href="/tools/goals"
            trackEvent="import-page-link"
            trackEventLabel="goal-counters"
          >
            {t('ImportPage.goal-cta')}
            <LuArrowRight />
          </MainLink>
        </Button>
      </Flex>
      <Flex
        flex="1"
        gap={4}
        flexWrap="wrap"
        align="center"
        justify="center"
        borderRadius="md"
        p={4}
        css={PREVIEW_BACKGROUNDS.lookup}
      >
        {GOAL_SAMPLES.map(({ sample, config, alt }) => {
          const [w, h] = GOAL_SIZES[config.variant];

          return (
            <Image
              key={`${sample}-${config.variant}`}
              src={goalSampleImagePath(sample, config)}
              alt={alt}
              width={`${w}px`}
              height={`${h}px`}
              loading="lazy"
            />
          );
        })}
      </Flex>
    </Flex>
  );
}

/** "Track a collection": checklists, how to fill them and where to import from */
export function ImportDynamicLists() {
  const t = useTranslations();

  return (
    <Box
      as="section"
      id="collections"
      scrollMarginTop="80px"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={`rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.4)`}
      bg={`linear-gradient(145deg, rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.16), rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.03))`}
      p={{ base: 4, md: 6 }}
    >
      <Flex align="center" gap={3} mb={5}>
        <Flex
          boxSize="42px"
          flexShrink={0}
          borderRadius="md"
          align="center"
          justify="center"
          bg={`rgba(${DYNAMIC_LIST_ACCENT_RGB}, 0.22)`}
        >
          <NextImage src={DynamicIcon} alt="" width={14} style={{ height: 'auto' }} />
        </Flex>
        <Box>
          <Text {...eyebrowProps}>{t('ImportPage.collections-eyebrow')}</Text>
          <Heading as="h2" size="lg">
            {t('ImportPage.dynamic-title')}
          </Heading>
        </Box>
      </Flex>

      <Flex direction="column" gap={5}>
        <ChecklistAutoUpdateBanner accent={DYNAMIC_LIST_ACCENT} variant="generic" />

        <ChecklistHowToTabs variant="generic" trackFrom="import-page" />

        <Box>
          <Heading as="h3" size="md">
            {t('ImportPage.collections-pick-title')}
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5} mb={3}>
            {t('ImportPage.collections-pick-hint')}
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {checklistPages.map((page) => (
              <PriceCheckerPageCard
                key={page.id}
                page={page}
                description={t(`ImportPage.source-${page.id}`)}
                trackEvent="import-page-source"
              />
            ))}
          </SimpleGrid>
        </Box>

        <GoalCounterShowcase />

        <Flex gap={2} flexWrap="wrap">
          <Button asChild size="sm" variant="outline">
            <MainLink
              viaNextLink
              prefetch={false}
              href="/lists/official"
              trackEvent="import-page-link"
              trackEventLabel="official-lists-cta"
            >
              {t('ImportPage.official-lists-cta')}
            </MainLink>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <MainLink
              viaNextLink
              prefetch={false}
              href="/articles/checklists-and-dynamic-lists"
              trackEvent="import-page-link"
              trackEventLabel="dynamic-lists-article"
            >
              {t('ImportPage.dynamic-article-cta')}
            </MainLink>
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
