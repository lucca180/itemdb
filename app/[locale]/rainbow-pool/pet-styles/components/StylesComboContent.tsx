import { Badge, Box, Flex, Heading, Link, Text, VStack } from '@chakra-ui/react';
import { createPoolBreadcrumbList, PoolBreadcrumbs } from '@components/Breadcrumbs/PoolBreadcrumbs';
import MainLink from '@components/Utils/MainLink';
import { IconLink } from '@components/Utils/IconLink';
import { groupStyleTokensBySeries } from '@utils/petStyles/display';
import type { StyleToken } from '@utils/petStyles/display';
import { STYLES_BASE_PATH, stylesBrowseHref, stylesComboHref } from '@utils/petStyles/paths';
import { petColorSlug } from '@utils/pet-utils';
import { getTranslations } from 'next-intl/server';
import { ComboPetPreview } from '../../components/ComboPetPreview';
import { RainbowPoolPicker } from '../../components/RainbowPoolPicker';
import { ShareLinkButton } from '../../components/RainbowPoolClient';
import { BASE_PATH, RainbowPoolShell } from '../../components/RainbowPoolShell';
import { StyleTokensSection } from './StyleTokenSeriesBlock';

type StylesComboContentProps = {
  locale: string;
  speciesName: string;
  colorName: string;
  colors: string[];
  species: string[];
  tokens: StyleToken[];
  /** Colour-agnostic bucket (`/{species}/unknown`). */
  isUnknownColor?: boolean;
};

export async function StylesComboContent({
  locale,
  speciesName,
  colorName,
  colors,
  species,
  tokens,
  isUnknownColor = false,
}: StylesComboContentProps) {
  const t = await getTranslations();
  const groups = groupStyleTokensBySeries(tokens);
  // Prefer style wearable over OpenNeo pet body — colour combos may not exist as pets.
  const previewUrl = tokens[0]?.previewUrl || tokens[0]?.imageUrl || '';
  const inStudioCount = tokens.filter((token) => token.inStudio).length;

  const paintSpeciesHref = `${BASE_PATH}/${petColorSlug(speciesName)}`;
  const title = isUnknownColor
    ? t('PetStyles.combo-h1-unknown', { species: speciesName })
    : t('PetStyles.combo-h1', { color: colorName, species: speciesName });

  const breadcrumbList = createPoolBreadcrumbList(
    (key) => t(key),
    [
      { name: t('PetStyles.breadcrumb'), item: STYLES_BASE_PATH },
      { name: speciesName, item: stylesBrowseHref(speciesName) },
      {
        name: isUnknownColor
          ? t('PetStyles.combo-h1-unknown', { species: speciesName })
          : `${colorName} ${speciesName}`,
        item: stylesComboHref(speciesName, colorName),
      },
    ]
  );

  return (
    <RainbowPoolShell>
      <PoolBreadcrumbs breadcrumbList={breadcrumbList} locale={locale} />

      <Flex justify="center" mb={4}>
        <RainbowPoolPicker
          colors={colors}
          species={species}
          initialSpecies={speciesName}
          initialColor={colorName}
          selectColorLabel={t('PetColors.select-color')}
          selectSpeciesLabel={t('PetColors.select-species')}
          searchLabel={t('Search.search')}
          basePath={STYLES_BASE_PATH}
        />
      </Flex>

      <Box display={{ base: 'block', md: 'none' }} maxW="1100px" mx="auto" px={2} mb={4}>
        <ComboHeader
          title={title}
          tokenCountLabel={t('PetStyles.token-count', { count: tokens.length })}
          availableNowLabel={
            inStudioCount > 0 ? t('PetStyles.available-now-count', { count: inStudioCount }) : null
          }
          copyLinkLabel={t('Layout.copy-link')}
          linkCopiedLabel={t('General.link-copied')}
        />
      </Box>

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
          {previewUrl ? (
            <ComboPetPreview
              bareUrl={previewUrl}
              clothedUrl={null}
              alt={tokens[0]?.name ?? `${colorName} ${speciesName}`}
              bareLabel={t('PetStyles.style-preview')}
              clothedLabel={t('PetStyles.with-style')}
              poweredByLabel={t('ItemPage.powered-by')}
            />
          ) : null}

          {isUnknownColor ? (
            <Box
              w="100%"
              p={3}
              borderRadius="lg"
              bg="blackAlpha.500"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
            >
              <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.900" mb={2}>
                {t('PetStyles.unknown-colour')}
              </Text>
              <Link asChild color="teal.200" fontWeight="semibold" fontSize="sm">
                <MainLink href={paintSpeciesHref}>
                  {t('PetStyles.browse-species-paint', { species: speciesName })}
                </MainLink>
              </Link>
            </Box>
          ) : (
            <Box
              w="100%"
              p={3}
              borderRadius="lg"
              bg="blackAlpha.500"
              borderWidth="1px"
              borderColor="orange.400/40"
            >
              <Text fontSize="sm" fontWeight="semibold" color="orange.200" mb={1}>
                {t('PetStyles.need-paint-title')}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700" mb={3} css={{ textWrap: 'pretty' }}>
                {t('PetStyles.need-paint-body')}
              </Text>
              <Link asChild color="orange.100" fontWeight="bold" fontSize="sm">
                <MainLink href={`${paintSpeciesHref}/${petColorSlug(colorName)}`}>
                  {t('PetStyles.need-paint-cta', { color: colorName, species: speciesName })}
                </MainLink>
              </Link>
            </Box>
          )}
        </VStack>

        <VStack align="stretch" gap={4} flex={1} w="100%" minW={0}>
          <Box display={{ base: 'none', md: 'block' }}>
            <ComboHeader
              title={title}
              tokenCountLabel={t('PetStyles.token-count', { count: tokens.length })}
              availableNowLabel={
                inStudioCount > 0
                  ? t('PetStyles.available-now-count', { count: inStudioCount })
                  : null
              }
              copyLinkLabel={t('Layout.copy-link')}
              linkCopiedLabel={t('General.link-copied')}
            />
          </Box>

          {tokens.length === 0 ? (
            <Box p={4} bg="blackAlpha.400" borderRadius="lg" textAlign="center">
              <Text mb={3}>{t('PetStyles.combo-empty')}</Text>
              <Link asChild color="teal.200">
                <MainLink href={paintSpeciesHref}>{t('PetStyles.view-paint-paths')}</MainLink>
              </Link>
            </Box>
          ) : (
            <StyleTokensSection
              groups={groups}
              heading={
                isUnknownColor
                  ? t('PetStyles.combo-tokens-heading-unknown', { species: speciesName })
                  : t('PetStyles.combo-tokens-heading', {
                      color: colorName,
                      species: speciesName,
                    })
              }
              hint={t('PetStyles.combo-hint')}
            />
          )}

          <Flex gap={3} flexWrap="wrap" fontSize="sm">
            <Link asChild color="teal.200">
              <MainLink href={stylesBrowseHref(speciesName)}>
                {t('PetStyles.all-species-styles', { species: speciesName })}
              </MainLink>
            </Link>
            <Text color="whiteAlpha.400">·</Text>
            <Link asChild color="teal.200">
              <MainLink href={stylesBrowseHref(colorName)}>
                {t('PetStyles.all-color-styles', { color: colorName })}
              </MainLink>
            </Link>
            <Text color="whiteAlpha.400">·</Text>
            <Link asChild color="teal.200">
              <MainLink href={STYLES_BASE_PATH}>{t('PetStyles.hub-link')}</MainLink>
            </Link>
            <Text color="whiteAlpha.400">·</Text>
            <IconLink
              href="https://www.neopets.com/mall/stylingstudio/"
              isExternal
              color="cyan.200"
            >
              {t('PetStyles.styling-studio')}
            </IconLink>
          </Flex>
        </VStack>
      </Flex>
    </RainbowPoolShell>
  );
}

function ComboHeader({
  title,
  tokenCountLabel,
  availableNowLabel,
  copyLinkLabel,
  linkCopiedLabel,
}: {
  title: string;
  tokenCountLabel: string;
  availableNowLabel: string | null;
  copyLinkLabel: string;
  linkCopiedLabel: string;
}) {
  return (
    <Box>
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Heading
          as="h1"
          size={{ base: 'lg', md: 'xl' }}
          flex={1}
          minW={0}
          css={{ textWrap: 'balance' }}
        >
          {title}
        </Heading>
        <Box flexShrink={0} pt={0.5}>
          <ShareLinkButton label={copyLinkLabel} toastTitle={linkCopiedLabel} />
        </Box>
      </Flex>
      <Flex gap={2} mt={2} flexWrap="wrap" align="center">
        <Text fontSize="sm" color="whiteAlpha.800">
          {tokenCountLabel}
        </Text>
        {availableNowLabel && (
          <Badge colorPalette="yellow" size="sm" color="yellow.200" bg="yellow.500/25">
            {availableNowLabel}
          </Badge>
        )}
      </Flex>
    </Box>
  );
}
