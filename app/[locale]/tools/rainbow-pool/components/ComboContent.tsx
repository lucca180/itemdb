import { Badge, Box, Flex, Heading, HStack, Link, Text, VStack } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { IconLink } from '@components/Utils/IconLink';
import ItemCard from '@components/Items/ItemCard';
import MainLink from '@components/Utils/MainLink';
import { PoolBreadcrumbs, createPoolBreadcrumbList } from '@components/Breadcrumbs/PoolBreadcrumbs';
import { howToGetComboTitle } from '@utils/petColorCopy';
import { petColorSlug } from '@utils/pet-utils';
import { buildPbOutfitPreviewUrl } from '@utils/pbOutfits';
import type { ItemData } from '@types';
import type { PetColorData, SpeciesInfo } from '@utils/petColorTool';
import { buildRainbowPoolLabels } from '../buildRainbowPoolLabels';
import { ComboPetPreview } from './ComboPetPreview';
import { OtherWays } from './OtherWays';
import { PathSection } from './PathSection';
import { PbOutfitSection } from './PbOutfitSection';
import { ShareLinkButton } from './RainbowPoolClient';
import { RainbowPoolPicker } from './RainbowPoolPicker';
import { BASE_PATH, RainbowPoolShell } from './RainbowPoolShell';

type ComboContentProps = {
  locale: string;
  petColorData: PetColorData;
  speciesInfo: SpeciesInfo | null;
  pbOutfit: ItemData[];
  colors: string[];
  species: string[];
};

export async function ComboContent({
  locale,
  petColorData,
  speciesInfo,
  pbOutfit,
  colors,
  species,
}: ComboContentProps) {
  const {
    speciesName,
    colorName,
    colorId,
    speciesId,
    thumbnail,
    perfectMatch,
    colorChanges,
    speciesChanges,
    cheapestChange,
    fountainAvailable,
    labAvailable,
  } = petColorData;

  if (!speciesName || !colorName) return null;

  const [t, labels, formatter] = await Promise.all([
    getTranslations(),
    buildRainbowPoolLabels(),
    getFormatter(),
  ]);

  const previewUrl = `/api/cache/preview/color/${thumbnail.species}_${thumbnail.color}.png`;
  const clothedPreviewUrl =
    pbOutfit.length > 0 ? buildPbOutfitPreviewUrl(pbOutfit, speciesId, colorId) : null;
  const total = cheapestChange.reduce((acc, item) => acc + (item.price.value ?? 0), 0);
  const totalLabel = `${total.toLocaleString('en-US')} NP`;

  const breadcrumbList = createPoolBreadcrumbList(t, [
    { name: speciesName, item: `${BASE_PATH}/${petColorSlug(speciesName)}` },
    {
      name: `${colorName} ${speciesName}`,
      item: `${BASE_PATH}/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
    },
  ]);

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={breadcrumbList} locale={locale} />

      <Flex justify="center" mb={4}>
        <RainbowPoolPicker
          colors={colors}
          species={species}
          initialSpecies={speciesName}
          initialColor={colorName}
          selectColorLabel={labels.selectColorLabel}
          selectSpeciesLabel={labels.selectSpeciesLabel}
          searchLabel={labels.searchLabel}
        />
      </Flex>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 5, md: 6 }}
        align={{ base: 'stretch', md: 'flex-start' }}
        maxW="1100px"
        mx="auto"
        px={2}
      >
        <VStack
          gap={3}
          flexShrink={0}
          w={{ base: '100%', md: '280px' }}
          align={{ base: 'center', md: 'stretch' }}
        >
          <ComboPetPreview
            bareUrl={previewUrl}
            clothedUrl={clothedPreviewUrl}
            alt={`${colorName} ${speciesName}`}
            bareLabel={t('PetColors.preview-bare')}
            clothedLabel={t('PetColors.preview-clothed')}
            poweredByLabel={labels.poweredByLabel}
          />

          <OtherWays
            availability={{ fountainAvailable, labAvailable }}
            colorName={colorName}
            compact
          />
        </VStack>

        <VStack align="stretch" gap={4} flex={1} w="100%" minW={0}>
          <HStack justify="space-between" align="flex-start" gap={2}>
            <Box>
              <Heading as="h1" size="xl">
                {howToGetComboTitle(t, colorName, speciesName)}
              </Heading>
              {speciesInfo && (
                <Text fontSize="sm" mt={2} color="whiteAlpha.800" css={{ textWrap: 'pretty' }}>
                  <SpeciesInfoInline speciesInfo={speciesInfo} t={t} formatter={formatter} />
                </Text>
              )}
            </Box>
            <ShareLinkButton label={labels.copyLinkLabel} toastTitle={labels.linkCopiedTitle} />
          </HStack>

          {cheapestChange.length > 0 && (
            <CostHeroInline
              items={cheapestChange}
              totalLabel={totalLabel}
              badgeLabel={labels.cheapestPathLabel}
            />
          )}

          {perfectMatch.length > 0 && (
            <PathSection
              label={labels.perfectMatchLabel}
              colorPalette="green"
              items={perfectMatch}
              uniqueIdPrefix="perfect"
            />
          )}

          <PathSection
            label={labels.colorChangeLabel}
            colorPalette="blue"
            items={colorChanges}
            uniqueIdPrefix="color"
            emptyMessage={
              <Text fontSize="xs" maxW="200px" textAlign="center">
                {labels.noColor1}
                <br />
                <br />
                {labels.noColor2}
              </Text>
            }
          />

          {speciesChanges.length > 0 && (
            <PathSection
              label={labels.speciesChangeLabel}
              colorPalette="purple"
              items={speciesChanges}
              uniqueIdPrefix="species"
              initialVisible={4}
            />
          )}

          <PbOutfitSection
            items={pbOutfit}
            label={t('PetColors.pb-outfit')}
            hint={t('PetColors.pb-outfit-hint')}
          />

          <Flex gap={3} flexWrap="wrap" fontSize="sm">
            <Link asChild color="teal.200">
              <MainLink href={`${BASE_PATH}/${petColorSlug(speciesName)}`}>
                {t('PetColors.all-colours-of', { 0: speciesName })}
              </MainLink>
            </Link>
            <Text color="whiteAlpha.400">·</Text>
            <Link asChild color="teal.200">
              <MainLink href={`${BASE_PATH}/${petColorSlug(colorName)}`}>
                {t('PetColors.all-pets-of', { 0: colorName })}
              </MainLink>
            </Link>
            <Text color="whiteAlpha.400">·</Text>
            <Link asChild color="teal.200">
              <MainLink href={`/hub/outfits/${petColorSlug(speciesName)}`}>
                {t('OutfitPage.exclusive-species-clothes', { species: speciesName })}
              </MainLink>
            </Link>
          </Flex>
        </VStack>
      </Flex>
    </RainbowPoolShell>
  );
}

function CostHeroInline({
  items,
  totalLabel,
  badgeLabel,
}: {
  items: ItemData[];
  totalLabel: string;
  badgeLabel: string;
}) {
  return (
    <Box
      w="100%"
      p={{ base: 3, md: 4 }}
      borderRadius="xl"
      bg="blackAlpha.500"
      borderWidth="1px"
      borderColor="orange.400/50"
      boxShadow="0 0 0 1px rgba(251, 146, 60, 0.15)"
    >
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        gap={2}
        flexWrap="wrap"
        mb={3}
      >
        <Badge colorPalette="orange" size="lg">
          {badgeLabel}
        </Badge>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="orange.200">
          {totalLabel}
        </Text>
      </Flex>
      <Flex flexWrap="wrap" gap={2}>
        {items.map((item) => (
          <ItemCard uniqueID="cheapest" small key={item.internal_id} item={item} />
        ))}
      </Flex>
    </Box>
  );
}

type SpeciesInfoInlineProps = {
  speciesInfo: SpeciesInfo;
  t: Awaited<ReturnType<typeof getTranslations>>;
  formatter: Awaited<ReturnType<typeof getFormatter>>;
};

function SpeciesInfoInline({ speciesInfo, t, formatter }: SpeciesInfoInlineProps) {
  let textTag = 'species-info-default';
  let link = '';

  if (speciesInfo.limited) {
    textTag = 'species-info-limited';
  }

  if (speciesInfo.restricted) {
    if (speciesInfo.name === 'Grundo') textTag = 'species-info-grundo';
    if (speciesInfo.name === 'Krawk') {
      textTag = 'species-info-krawk';
      link = 'https://itemdb.com.br/search?s=&petpetSpecies[]=154';
    }
    if (speciesInfo.name === 'Draik') {
      textTag = 'species-info-draik';
      link = 'https://itemdb.com.br/search?s=draik%20egg&category[]=Medieval%20Food';
    }
  }

  const [day, month] = speciesInfo.petDate.split('-').map(Number);
  const speciesDate = formatter.dateTime(new Date(2000, month - 1, day), {
    day: '2-digit',
    month: 'long',
  });

  return (
    <>
      {t.rich(`PetColors.${textTag}`, {
        b: (chunk) => <b>{chunk}</b>,
        species: speciesInfo.name,
        speciesDate,
        CreateLink: (chunk) => (
          <IconLink color="#9ee1cf" href="https://www.neopets.com/reg/page4.phtml" isExternal>
            {chunk}
          </IconLink>
        ),
        Link: (chunk) => (
          <IconLink color="#9ee1cf" href={link} isExternal>
            {chunk}
          </IconLink>
        ),
      })}
    </>
  );
}
