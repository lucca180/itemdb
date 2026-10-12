'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Group,
  Heading,
  Image,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { createToolsBreadcrumbList } from '@components/Breadcrumbs/ToolsBreadcrumbs';
import HeaderCard from '@components/Card/HeaderCard';
import MainLink from '@components/Utils/MainLink';
import { GOAL_COLLECTIONS, type GoalCollectionSlug } from '@utils/goalCounter/collections';
import {
  GOAL_BACKGROUNDS,
  GOAL_SIZES,
  STAMP_VARIANTS,
  VARIANT_BACKGROUNDS,
  goalSampleImagePath,
  type GoalBackground,
  type GoalConfig,
  type GoalVariant,
} from '@utils/goalCounter/config';
import {
  PREVIEW_BACKGROUNDS,
  PREVIEW_BACKGROUND_KEYS,
  type PreviewBackground,
} from '@utils/goalCounter/previewSurfaces';
import {
  GOALS_ACCENT,
  GOALS_ACCENT_LIGHT,
  GOALS_ACCENT_RGB,
  SAMPLE_COLLECTIONS,
  SAMPLE_STAMP_ALBUMS,
  STAMP_ALBUMS_HREF,
  collectionHref,
} from './goalsPageData';

const STEPS = ['step-1', 'step-2', 'step-3', 'step-4'] as const;
const FAQ = ['update', 'private', 'where', 'owner'] as const;

const configFor = (variant: GoalVariant, bg: GoalBackground): GoalConfig => {
  const allowed = VARIANT_BACKGROUNDS[variant];
  return { variant, bg: allowed.includes(bg) ? bg : allowed[0] };
};

export function GoalsPageClient() {
  const t = useTranslations();
  const locale = useLocale();
  const breadcrumbList = createToolsBreadcrumbList(
    (key) => t(key),
    [{ name: t('GoalsTool.title'), item: '/tools/goals' }]
  );

  const [albumId, setAlbumId] = useState<number>(SAMPLE_STAMP_ALBUMS[0].id);
  const [bg, setBg] = useState<GoalBackground>('transparent');
  const [previewBg, setPreviewBg] = useState<PreviewBackground>('lookup');
  const surface = PREVIEW_BACKGROUNDS[previewBg];

  return (
    <>
      <HeaderCard
        color={GOALS_ACCENT}
        breadcrumb={<BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />}
        image={{
          src: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
          alt: t('GoalsTool.title'),
        }}
      >
        <Heading as="h1" size="lg">
          {t('GoalsTool.h1')}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{t('GoalsTool.description')}</Text>
      </HeaderCard>

      <Flex
        direction="column"
        gap={{ base: 8, md: 10 }}
        w="full"
        maxW="1100px"
        css={{ '& a': { color: GOALS_ACCENT_LIGHT } }}
      >
        <HowItWorks />

        {/* --- Stamp albums --- */}
        <Box as="section">
          <SectionTitle
            eyebrow={t('GoalsTool.stamps-eyebrow')}
            title={t('GoalsTool.stamps-title')}
            hint={t('GoalsTool.stamps-hint')}
          />

          <Flex gap={4} mb={4} flexWrap="wrap" align="flex-end">
            <Box>
              <ControlLabel>{t('GoalsTool.album')}</ControlLabel>
              <Group attached flexWrap="wrap">
                {SAMPLE_STAMP_ALBUMS.map((album) => (
                  <Button
                    key={album.id}
                    size="xs"
                    variant={albumId === album.id ? 'solid' : 'outline'}
                    aria-pressed={albumId === album.id}
                    onClick={() => setAlbumId(album.id)}
                    data-umami-event="goals-tool-album"
                    data-umami-event-label={`stamps-${album.id}`}
                  >
                    {album.name}
                  </Button>
                ))}
              </Group>
            </Box>
            <Box>
              <ControlLabel>{t('GoalCounter.background')}</ControlLabel>
              <Group attached>
                {GOAL_BACKGROUNDS.map((key) => (
                  <Button
                    key={key}
                    size="xs"
                    variant={bg === key ? 'solid' : 'outline'}
                    aria-pressed={bg === key}
                    onClick={() => setBg(key)}
                    data-umami-event="goals-tool-bg"
                    data-umami-event-label={key}
                  >
                    {t(`GoalCounter.bg-option-${key}`)}
                  </Button>
                ))}
              </Group>
            </Box>
            <Box>
              <ControlLabel>{t('GoalsTool.surface')}</ControlLabel>
              <Group attached>
                {PREVIEW_BACKGROUND_KEYS.map((key) => (
                  <Button
                    key={key}
                    size="xs"
                    variant={previewBg === key ? 'solid' : 'outline'}
                    aria-pressed={previewBg === key}
                    onClick={() => setPreviewBg(key)}
                    data-umami-event="goals-tool-preview-bg"
                    data-umami-event-label={key}
                  >
                    {t(`GoalCounter.bg-${key}`)}
                  </Button>
                ))}
              </Group>
            </Box>
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            {STAMP_VARIANTS.map((variant) => (
              <SampleCard
                key={variant}
                src={goalSampleImagePath(`stamps-${albumId}`, configFor(variant, bg))}
                surface={surface}
                title={t(`GoalCounter.variant-${variant}`)}
                variant={variant}
              />
            ))}
          </SimpleGrid>

          <Alert.Root status="info" size="sm" borderRadius="md" mt={4} maxW="fit-content">
            <Alert.Indicator />
            <Alert.Description>{t('GoalsTool.stamps-disclaimer')}</Alert.Description>
          </Alert.Root>
        </Box>

        {/* --- Collections --- */}
        <Box as="section">
          <SectionTitle
            eyebrow={t('GoalsTool.collections-eyebrow')}
            title={t('GoalsTool.collections-title')}
            hint={t('GoalsTool.collections-hint')}
          />
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            {SAMPLE_COLLECTIONS.map((slug) => (
              <SampleCard
                key={slug}
                src={goalSampleImagePath(slug, configFor('classic', bg))}
                surface={surface}
                title={GOAL_COLLECTIONS[slug].title}
                variant="classic"
                collection={slug}
              />
            ))}
          </SimpleGrid>
        </Box>

        {/* --- Good to know --- */}
        <Box as="section">
          <Heading as="h2" size="lg" mb={4}>
            {t('GoalsTool.faq-title')}
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
                  {t(`GoalsTool.faq-${key}-title`)}
                </Heading>
                <Text fontSize="sm" color="gray.400" lineHeight="1.55">
                  {t(`GoalsTool.faq-${key}`)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Flex>
    </>
  );
}

function HowItWorks() {
  const t = useTranslations();

  return (
    <Box
      as="section"
      borderWidth="1px"
      borderColor={`rgba(${GOALS_ACCENT_RGB}, 0.4)`}
      borderRadius="xl"
      bg={`linear-gradient(160deg, rgba(${GOALS_ACCENT_RGB}, 0.14), rgba(${GOALS_ACCENT_RGB}, 0.03))`}
      p={{ base: 4, md: 5 }}
    >
      <Heading as="h2" size="lg" mb={4}>
        {t('GoalsTool.how-it-works')}
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={{ base: 5, lg: 4 }}>
        {STEPS.map((step, index) => (
          <Flex key={step} gap={3} direction={{ base: 'row', lg: 'column' }}>
            <Flex
              boxSize="32px"
              flexShrink={0}
              borderRadius="full"
              align="center"
              justify="center"
              bg={GOALS_ACCENT}
              color="white"
              fontSize="sm"
              fontWeight="bold"
            >
              {index + 1}
            </Flex>
            <Box>
              <Heading as="h3" size="sm" mb={1}>
                {t(`GoalsTool.${step}-title`)}
              </Heading>
              <Text as="div" fontSize="sm" color="gray.300" lineHeight="1.55">
                {t.rich(`GoalsTool.${step}`, {
                  b: (chunks) => <b>{chunks}</b>,
                  StampsLink: (chunks) => (
                    <MainLink
                      viaNextLink
                      prefetch={false}
                      href={STAMP_ALBUMS_HREF}
                      trackEvent="goals-tool-link"
                      trackEventLabel="stamp-albums"
                    >
                      <Text as="span" fontWeight="semibold">
                        {chunks}
                      </Text>
                    </MainLink>
                  ),
                })}
              </Text>
            </Box>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function SectionTitle({ eyebrow, title, hint }: { eyebrow: string; title: string; hint: string }) {
  return (
    <Box mb={4}>
      <Text
        color={GOALS_ACCENT_LIGHT}
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.14em"
        textTransform="uppercase"
      >
        {eyebrow}
      </Text>
      <Heading as="h2" size="lg" mt={1}>
        {title}
      </Heading>
      <Text color="gray.400" fontSize="sm" mt={1}>
        {hint}
      </Text>
    </Box>
  );
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
      {children}
    </Text>
  );
}

type SampleCardProps = {
  src: string;
  surface: (typeof PREVIEW_BACKGROUNDS)[PreviewBackground];
  title: string;
  variant: GoalVariant;
  collection?: GoalCollectionSlug;
};

function SampleCard({ src, surface, title, variant, collection }: SampleCardProps) {
  const t = useTranslations();
  const [w, h] = GOAL_SIZES[variant];

  return (
    <Box borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" bg="whiteAlpha.50" p={3}>
      <Flex h="120px" align="center" justify="center" borderRadius="md" css={surface}>
        <Image src={src} alt={title} width={`${w}px`} height={`${h}px`} loading="lazy" />
      </Flex>
      <Flex mt={2} align="baseline" justify="space-between" gap={2} flexWrap="wrap">
        <Text fontSize="sm" fontWeight="semibold">
          {title}{' '}
          <Text as="span" fontSize="xs" fontWeight="normal" color="whiteAlpha.600">
            · {w}×{h} px
          </Text>
        </Text>
        {collection && (
          <MainLink
            viaNextLink
            prefetch={false}
            href={collectionHref(collection)}
            trackEvent="goals-tool-link"
            trackEventLabel={collection}
          >
            <Text as="span" fontSize="xs" fontWeight="semibold">
              {t('GoalsTool.view-list')}
            </Text>
          </MainLink>
        )}
      </Flex>
    </Box>
  );
}
