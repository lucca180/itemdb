import { Center, Flex, Heading, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import MainLink from '@components/Utils/MainLink';
import { browseColorTitle, browseSpeciesTitle } from '@utils/petColorCopy';
import { petColorSlug } from '@utils/pet-utils';
import type { RainbowPoolComboTile } from '@utils/petColorTool';
import { stylesBrowseHref } from '@utils/petStyles/paths';
import type { ItemV2For } from '@types';
import { buildRainbowPoolLabels } from '../buildRainbowPoolLabels';
import { BASE_PATH, RainbowPoolShell } from './RainbowPoolShell';
import { ComboTile } from './ComboTile';
import { PathSection } from './PathSection';
import { RainbowPoolPicker } from './RainbowPoolPicker';

type BrowseContentProps = {
  locale: string;
  mode: 'species' | 'color';
  name: string;
  combos: RainbowPoolComboTile[];
  pathItems: ItemV2For<'card'>[];
  chanceItems: ItemV2For<'card'>[];
  colors: string[];
  species: string[];
};

export async function BrowseContent({
  locale,
  mode,
  name,
  combos,
  pathItems,
  chanceItems,
  colors,
  species,
}: BrowseContentProps) {
  const [t, labels] = await Promise.all([getTranslations(), buildRainbowPoolLabels()]);

  const h1 = mode === 'species' ? browseSpeciesTitle(t, name) : browseColorTitle(t, name);
  const subtitle =
    mode === 'species'
      ? t('PetColors.species-description', { 0: name })
      : t('PetColors.paint-description', { 0: name });
  const gridTitle =
    mode === 'species'
      ? t('PetColors.all-colours-of', { 0: name })
      : t('PetColors.all-pets-of', { 0: name });

  const breadcrumbList = createPoolBreadcrumbList(t, [
    { name, item: `${BASE_PATH}/${petColorSlug(name)}` },
  ]);

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
        <RainbowPoolPicker
          colors={colors}
          species={species}
          initialSpecies={mode === 'species' ? name : ''}
          initialColor={mode === 'color' ? name : ''}
          selectColorLabel={labels.selectColorLabel}
          selectSpeciesLabel={labels.selectSpeciesLabel}
          searchLabel={labels.searchLabel}
        />
        <Link asChild fontSize="sm" color="cyan.200" fontWeight="semibold" mt={1}>
          <MainLink href={stylesBrowseHref(name)}>
            {mode === 'species'
              ? t('PetStyles.all-species-styles', { species: name })
              : t('PetStyles.all-color-styles', { color: name })}
          </MainLink>
        </Link>
      </Center>

      <VStack align="stretch" gap={4} maxW="1100px" mx="auto" px={2}>
        {(pathItems.length > 0 || chanceItems.length > 0) && (
          <VStack align="stretch" gap={3}>
            {pathItems.length > 0 && (
              <PathSection
                label={mode === 'species' ? labels.speciesChangeLabel : labels.colorChangeLabel}
                colorPalette={mode === 'species' ? 'purple' : 'blue'}
                items={pathItems}
                uniqueIdPrefix={mode === 'species' ? 'species' : 'color'}
                labelAsHeading
              />
            )}
            {chanceItems.length > 0 && (
              <PathSection
                label={labels.chanceOptionsLabel}
                colorPalette="orange"
                items={chanceItems}
                uniqueIdPrefix="chance"
                hint={labels.chanceOptionsHint}
                initialVisible={4}
                labelAsHeading
              />
            )}
          </VStack>
        )}

        <Flex justify="space-between" align="baseline" gap={2} flexWrap="wrap">
          <Heading as="h2" size="md">
            {gridTitle}
          </Heading>
        </Flex>

        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
          {combos.map((combo) => (
            <ComboTile
              key={combo.href}
              combo={combo}
              titleMode={mode === 'species' ? 'color' : 'species'}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </RainbowPoolShell>
  );
}
