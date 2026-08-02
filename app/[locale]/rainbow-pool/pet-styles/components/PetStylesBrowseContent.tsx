import { Center, Flex, Heading, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import MainLink from '@components/Utils/MainLink';
import { petColorSlug } from '@utils/pet-utils';
import type { StyleComboTile, StyleToken } from '@utils/petStyles/display';
import { STYLES_BASE_PATH, UNKNOWN_COLOR_NAME, stylesBrowseHref } from '@utils/petStyles/paths';
import { getTranslations } from 'next-intl/server';
import { ComboTile } from '../../components/ComboTile';
import { BASE_PATH, RainbowPoolShell } from '../../components/RainbowPoolShell';
import { HubResultsGrid, PetStylesSearchBar } from './PetStylesSearchBar';

/** Preview tiles at the bottom before linking to the full paint browse hub. */
const COMBO_PREVIEW_LIMIT = 8;

type PetStylesBrowseContentProps = {
  locale: string;
  mode: 'species' | 'color';
  name: string;
  colors: string[];
  species: string[];
  seriesOptions: string[];
  tokens: StyleToken[];
  total: number;
  page: number;
  pageSize: number;
  combos: StyleComboTile[];
  seriesName?: string;
  prismatic?: boolean;
  availableNow?: boolean;
};

export async function PetStylesBrowseContent({
  locale,
  mode,
  name,
  colors,
  species,
  seriesOptions,
  tokens,
  total,
  page,
  pageSize,
  combos,
  seriesName = '',
  prismatic = false,
  availableNow = false,
}: PetStylesBrowseContentProps) {
  const t = await getTranslations();
  const previewCombos = combos.slice(0, COMBO_PREVIEW_LIMIT);
  const isUnknown = name === UNKNOWN_COLOR_NAME;
  const paintBrowseHref = isUnknown ? BASE_PATH : `${BASE_PATH}/${petColorSlug(name)}`;
  const browsePath = stylesBrowseHref(name);
  const hasActiveFilter = Boolean(seriesName || prismatic || availableNow);
  const isPageDefault = !hasActiveFilter && page === 1;

  const h1 = isUnknown ? t('PetStyles.browse-h1-unknown') : t('PetStyles.browse-h1', { name });
  const subtitle =
    mode === 'species'
      ? t('PetStyles.browse-lede-species', { name })
      : isUnknown
        ? t('PetStyles.browse-lede-unknown')
        : t('PetStyles.browse-lede-color', { name });
  const combosHeading =
    mode === 'species'
      ? t('PetStyles.combos-heading-species', { name })
      : isUnknown
        ? t('PetStyles.combos-heading-unknown')
        : t('PetStyles.combos-heading-color', { name });
  const moreLabel =
    mode === 'species'
      ? t('PetStyles.more-species-colours', { name })
      : isUnknown
        ? t('PetStyles.more-unknown')
        : t('PetStyles.more-color-pets', { name });

  const breadcrumbList = createPoolBreadcrumbList(
    (key) => t(key),
    [
      { name: t('PetStyles.breadcrumb'), item: STYLES_BASE_PATH },
      { name, item: browsePath },
    ]
  );

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={breadcrumbList} locale={locale} />

      <Center flexFlow="column" gap={3} textAlign="center" mt={4} mb={6}>
        <Heading as="h1" size="xl">
          {h1}
        </Heading>
        <Text maxW="640px" fontSize="sm" color="whiteAlpha.900" css={{ textWrap: 'pretty' }}>
          {subtitle}
        </Text>
        <PetStylesSearchBar
          colors={colors}
          species={species}
          seriesOptions={seriesOptions}
          initialSpecies={mode === 'species' ? name : ''}
          initialColor={mode === 'color' ? name : ''}
          initialSeries={seriesName}
          initialPrismatic={prismatic}
          initialAvailableNow={availableNow}
          isPageDefault={isPageDefault}
        />
      </Center>

      <VStack align="stretch" gap={8} maxW="1100px" mx="auto" px={2} pb={8}>
        <VStack align="stretch" gap={3}>
          <Flex justify="space-between" align="baseline" gap={2} flexWrap="wrap">
            <Heading as="h2" size="md">
              {hasActiveFilter ? t('PetStyles.search-results') : t('PetStyles.all-tokens')}
            </Heading>
          </Flex>
          <HubResultsGrid
            tokens={tokens}
            total={total}
            page={page}
            pageSize={pageSize}
            pathname={browsePath}
            seriesName={seriesName}
            prismatic={prismatic}
            availableNow={availableNow}
          />
        </VStack>

        {previewCombos.length > 0 && (
          <VStack align="stretch" gap={3}>
            <Heading as="h2" size="md">
              {combosHeading}
            </Heading>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
              {previewCombos.map((combo) => (
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
                  titleMode={mode === 'species' ? 'color' : 'species'}
                  releasedLabel={t('PetStyles.styles-count', { count: combo.styleCount })}
                />
              ))}
            </SimpleGrid>
            <Flex justify="center" pt={1}>
              <Link asChild fontSize="sm" color="teal.200" fontWeight="semibold">
                <MainLink href={paintBrowseHref}>{moreLabel}</MainLink>
              </Link>
            </Flex>
          </VStack>
        )}
      </VStack>
    </RainbowPoolShell>
  );
}
