import { Suspense } from 'react';
import { Box, Flex, Image, Link as ChakraLink, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { ItemData, ItemEffect, ItemPetpetData, UserList } from '@types';
import CardBase from '@components/Card/CardBase';
import { getTranslations } from 'next-intl/server';
import { Link } from '@i18n/navigation';
import {
  getOfficialItemLists,
  loadItemEffects,
  loadPbOutfitComboForItem,
  loadPetpetData,
  loadPetStyleForItem,
  type PetStyleLinkData,
} from '@app/_components/Item/loadUtils';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import { browseColorTitle, browseSpeciesTitle, indefiniteArticle } from '@utils/petColorCopy';
import { getSpeciesFromString, petColorSlug } from '@utils/pet-utils';
import {
  getPetpetMapIdByName,
  getPetpetSpeciesNameFromItemName,
  type PetpetCatalogMaps,
} from '@utils/petpet-catalog';
import { getPetpetColorMaps, getPetpetSpeciesMaps } from '@app/server/petpetCatalog';
import {
  STYLES_BASE_PATH,
  stylesBrowseHref,
  stylesComboHref,
  stylesUnknownHref,
} from '@utils/petStyles/paths';
import { isStudioEssentialItemName } from '@utils/petStyles/studioEssentials';
import { resolveRelatedLinkCandidates, type RelatedLinkCandidate } from '@utils/item/relatedLinks';
import type { PbOutfitCombo } from '@utils/pbOutfits';

const STYLING_STUDIO_ICON =
  'https://images.neopets.com/themes/h5/basic/images/stylingstudio-icon.png';

type Props = {
  item: ItemData;
};

export default function RelatedLinksCard(props: Props) {
  return (
    <Suspense fallback={null}>
      <RelatedLinksCardContent {...props} />
    </Suspense>
  );
}

async function RelatedLinksCardContent({ item }: Props) {
  const [
    t,
    itemEffects,
    lists,
    petpetData,
    petStyle,
    petpetSpeciesMaps,
    petpetColorMaps,
    pbOutfitCombo,
  ] = await Promise.all([
    getTranslations(),
    loadItemEffects(item.internal_id),
    getOfficialItemLists(item.internal_id, shouldShowTradeLists(item, await getCachedNow())),
    loadPetpetData(item.internal_id),
    loadPetStyleForItem(item.internal_id),
    getPetpetSpeciesMaps(),
    getPetpetColorMaps(),
    item.type === 'pb' && item.isWearable
      ? loadPbOutfitComboForItem(item.internal_id, item.name, item.type, item.isWearable)
      : Promise.resolve(null),
  ]);
  const relatedLinks = buildRelatedLinks(item, t, {
    itemEffects,
    lists,
    petpetData: petpetData || undefined,
    petStyle,
    petpetSpeciesMaps,
    petpetColorMaps,
    pbOutfitCombo,
  });
  const color = item.color.rgb;

  if (relatedLinks.length === 0) return null;

  return (
    <CardBase title={t('ItemPage.related-links')} color={color} chakra={{ p: 2 }}>
      <Flex gap={1} flexFlow="column">
        {relatedLinks.map((link) => (
          <ChakraLink
            key={link.id}
            asChild
            display="block"
            borderRadius="sm"
            color="inherit"
            outline="none"
            textDecoration="none"
            transition="background-color 0.15s ease"
            _hover={{
              bg: 'whiteAlpha.100',
              textDecoration: 'none',
              '& [data-related-link-chevron]': {
                color: 'gray.200',
                transform: 'translateX(2px)',
              },
            }}
            _active={{ bg: 'whiteAlpha.200' }}
            _focusVisible={{
              bg: 'whiteAlpha.100',
              outline: '2px solid',
              outlineColor: 'blue.300',
              outlineOffset: '2px',
            }}
          >
            <Link
              href={link.href}
              prefetch={false}
              data-umami-event={link.trackEvent}
              data-umami-event-label={link.trackEventLabel}
            >
              <Flex align="center" gap={3} minH="48px" px={2} py={1.5}>
                <Flex
                  align="center"
                  bg="blackAlpha.200"
                  borderRadius="sm"
                  flex="0 0 36px"
                  h="36px"
                  justify="center"
                >
                  <Image
                    alt=""
                    h="26px"
                    loading="lazy"
                    objectFit="contain"
                    src={link.imageUrl}
                    w="26px"
                  />
                </Flex>
                <Text flex="1" fontSize="sm" lineHeight="short" lineClamp={2}>
                  {link.children}
                </Text>
                <Box
                  aria-hidden
                  color="gray.400"
                  data-related-link-chevron
                  flexShrink={0}
                  fontSize="xl"
                  lineHeight="1"
                  transition="transform 0.15s ease, color 0.15s ease"
                >
                  ›
                </Box>
              </Flex>
            </Link>
          </ChakraLink>
        ))}
      </Flex>
    </CardBase>
  );
}

function getSpeciesImage(speciesName: string): string {
  const normalizedSpecies = speciesName.toLowerCase();

  if (normalizedSpecies === 'varwolf') {
    return '/icons/varwolf.png';
  }
  if (normalizedSpecies === 'vandagyre') {
    return 'https://images.neopets.com/neoboards/smilies/vandagyre.gif';
  }

  return `https://images.neopets.com/community/hub/calendar/events/${normalizedSpecies}.png`;
}

type RelatedLinkProps = RelatedLinkCandidate & {
  imageUrl: string;
  children: ReactNode;
  trackEvent?: string;
  trackEventLabel?: string;
};

type RelatedOthers = {
  itemEffects?: ItemEffect[];
  lists?: UserList[];
  petpetData?: ItemPetpetData;
  petStyle?: PetStyleLinkData | null;
  petpetSpeciesMaps: PetpetCatalogMaps;
  petpetColorMaps: PetpetCatalogMaps;
  pbOutfitCombo?: PbOutfitCombo | null;
};

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function buildRelatedLinks(item: ItemData, t: Translate, rest: RelatedOthers) {
  const {
    itemEffects,
    lists,
    petpetData,
    petStyle,
    petpetSpeciesMaps,
    petpetColorMaps,
    pbOutfitCombo,
  } = rest;
  const rainbowLinks: RelatedLinkProps[] = [];
  const outfitLinks: RelatedLinkProps[] = [];
  const petStyleLinks: RelatedLinkProps[] = [];
  const checklistLinks: RelatedLinkProps[] = [];
  const petpetLinks: RelatedLinkProps[] = [];
  const ncLinks: RelatedLinkProps[] = [];
  const speciesName = getSpeciesFromString(item.name);
  const colorSpeciesEffects = (itemEffects ?? []).filter(
    (effect) =>
      effect.type === 'colorSpecies' && Boolean(effect.speciesTarget || effect.colorTarget)
  );
  const comboEffects = colorSpeciesEffects.filter(
    (effect) => effect.speciesTarget && effect.colorTarget
  );
  const comboSpeciesSlugs = new Set(
    comboEffects.map((effect) => petColorSlug(effect.speciesTarget!))
  );
  const comboColorSlugs = new Set(comboEffects.map((effect) => petColorSlug(effect.colorTarget!)));

  if (pbOutfitCombo) {
    // A validated PB outfit combo has the same dominance as an ItemEffect combo: do not also
    // show broader Rainbow Pool/Pet Styles browse links for this species or colour.
    comboSpeciesSlugs.add(petColorSlug(pbOutfitCombo.speciesName));
    comboColorSlugs.add(petColorSlug(pbOutfitCombo.colorName));
  }

  if (pbOutfitCombo) {
    const speciesSlug = petColorSlug(pbOutfitCombo.speciesName);
    const colorSlug = petColorSlug(pbOutfitCombo.colorName);
    rainbowLinks.push({
      id: `rainbow:combo:${speciesSlug}:${colorSlug}`,
      href: `/rainbow-pool/${speciesSlug}/${colorSlug}`,
      family: 'rainbow',
      source: 'pb-outfit',
      specificity: 'combo',
      priority: 0,
      imageUrl: getSpeciesImage(pbOutfitCombo.speciesName),
      trackEvent: 'related-link',
      trackEventLabel: 'pb-outfit-combo',
      children: t('ItemPage.related-combo-painting', {
        article: indefiniteArticle(pbOutfitCombo.colorName),
        color: pbOutfitCombo.colorName,
        species: pbOutfitCombo.speciesName,
      }),
    });
  }

  // PB and ItemEffect can independently resolve to the same combo. They intentionally emit the
  // same semantic id/href; resolveRelatedLinkCandidates keeps the first (PB) candidate.
  comboEffects.forEach((effect) => {
    const speciesTarget = effect.speciesTarget!;
    const colorTarget = effect.colorTarget!;
    const speciesSlug = petColorSlug(speciesTarget);
    const colorSlug = petColorSlug(colorTarget);
    rainbowLinks.push({
      id: `rainbow:combo:${speciesSlug}:${colorSlug}`,
      href: `/rainbow-pool/${speciesSlug}/${colorSlug}`,
      family: 'rainbow',
      source: 'item-effect',
      specificity: 'combo',
      priority: 0,
      imageUrl: getSpeciesImage(speciesTarget),
      trackEvent: 'related-link',
      trackEventLabel: 'color-species-painting',
      children: t('ItemPage.related-combo-painting', {
        article: indefiniteArticle(colorTarget),
        color: colorTarget,
        species: speciesTarget,
      }),
    });
  });

  if (speciesName) {
    if (!comboSpeciesSlugs.has(petColorSlug(speciesName))) {
      const speciesSlug = petColorSlug(speciesName);
      rainbowLinks.push({
        id: `rainbow:browse:species:${speciesSlug}`,
        href: `/rainbow-pool/${speciesSlug}`,
        family: 'rainbow',
        source: 'item-name',
        specificity: 'browse',
        priority: 10,
        imageUrl: getSpeciesImage(speciesName),
        trackEvent: 'related-link',
        trackEventLabel: 'rainbow-pool',
        children: browseSpeciesTitle(t, speciesName),
      });
    }

    outfitLinks.push({
      id: `outfits:species:${petColorSlug(speciesName)}`,
      href: `/hub/outfits/${speciesName?.toLowerCase()}`,
      family: 'outfits',
      source: 'item-name',
      specificity: 'browse',
      priority: 0,
      imageUrl: '/icons/closet.svg',
      trackEvent: 'related-link',
      trackEventLabel: 'exclusive-clothes',
      children: t.rich('ItemPage.exclusive-0-clothes-guide', {
        0: speciesName,
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  }

  colorSpeciesEffects
    .filter((effect) => !effect.speciesTarget || !effect.colorTarget)
    .forEach((effect) => {
      const target = effect.colorTarget ?? effect.speciesTarget!;
      const isColor = Boolean(effect.colorTarget);
      const targetSlug = petColorSlug(target);
      if (
        (isColor && comboColorSlugs.has(targetSlug)) ||
        (!isColor && comboSpeciesSlugs.has(targetSlug))
      ) {
        return;
      }
      rainbowLinks.push({
        id: `rainbow:browse:${isColor ? 'color' : 'species'}:${targetSlug}`,
        href: `/rainbow-pool/${targetSlug}`,
        family: 'rainbow',
        source: 'item-effect',
        specificity: 'browse',
        priority: 10,
        imageUrl: item.image,
        trackEvent: 'related-link',
        trackEventLabel: isColor ? 'color-painting' : 'species-painting',
        children: isColor ? browseColorTitle(t, target) : browseSpeciesTitle(t, target),
      });
    });

  if (petStyle) {
    const href = petStyle.colorName
      ? stylesComboHref(petStyle.speciesName, petStyle.colorName)
      : stylesUnknownHref(petStyle.speciesName);
    petStyleLinks.push({
      id: `pet-styles:combo:${petColorSlug(petStyle.speciesName)}:${petColorSlug(
        petStyle.colorName ?? 'unknown'
      )}`,
      href,
      family: 'pet-styles',
      source: 'pet-style',
      specificity: 'combo',
      priority: 0,
      imageUrl: STYLING_STUDIO_ICON,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles-combo',
      children: petStyle.colorName
        ? t.rich('PetStyles.related-combo-styles', {
            combo: `${petStyle.colorName} ${petStyle.speciesName}`,
            b: (chunk) => <b>{chunk}</b>,
          })
        : t.rich('PetStyles.related-unknown-combo-styles', {
            species: petStyle.speciesName,
            b: (chunk) => <b>{chunk}</b>,
          }),
    });
  }

  comboEffects.forEach((effect) => {
    const speciesTarget = effect.speciesTarget!;
    const colorTarget = effect.colorTarget!;
    petStyleLinks.push({
      id: `pet-styles:combo:${petColorSlug(speciesTarget)}:${petColorSlug(colorTarget)}`,
      href: stylesComboHref(speciesTarget, colorTarget),
      family: 'pet-styles',
      source: 'item-effect',
      specificity: 'combo',
      priority: 0,
      imageUrl: STYLING_STUDIO_ICON,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles-combo',
      children: t.rich('PetStyles.related-combo-styles', {
        combo: `${colorTarget} ${speciesTarget}`,
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  });

  if (isStudioEssentialItemName(item.name)) {
    petStyleLinks.push({
      id: 'pet-styles:hub:studio-essentials',
      href: STYLES_BASE_PATH,
      family: 'pet-styles',
      source: 'studio-essential-name',
      specificity: 'hub',
      priority: 10,
      imageUrl: STYLING_STUDIO_ICON,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles-hub',
      children: t.rich('PetStyles.related-supplies-hub', {
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  }

  if (speciesName && !comboSpeciesSlugs.has(petColorSlug(speciesName))) {
    const speciesSlug = petColorSlug(speciesName);
    petStyleLinks.push({
      id: `pet-styles:browse:species:${speciesSlug}`,
      href: stylesBrowseHref(speciesName),
      family: 'pet-styles',
      source: 'item-name',
      specificity: 'browse',
      priority: 20,
      imageUrl: STYLING_STUDIO_ICON,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles',
      children: t('PetStyles.all-species-styles', { species: speciesName }),
    });
  }

  colorSpeciesEffects.forEach((effect) => {
    if (!effect.colorTarget) return;
    if (comboColorSlugs.has(petColorSlug(effect.colorTarget))) return;
    const colorSlug = petColorSlug(effect.colorTarget);
    petStyleLinks.push({
      id: `pet-styles:browse:color:${colorSlug}`,
      href: stylesBrowseHref(effect.colorTarget),
      family: 'pet-styles',
      source: 'item-effect',
      specificity: 'browse',
      priority: 20,
      imageUrl: STYLING_STUDIO_ICON,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles',
      children: t('PetStyles.all-color-styles', { color: effect.colorTarget }),
    });
  });

  const checklists = ['gourmet-food', 'neodeck', 'book-award', 'booktastic-book-award'];
  let stampAlbumAdded = false;
  lists?.forEach((list) => {
    if (!list.official) return;

    if (list.slug && checklists.includes(list.slug)) {
      checklistLinks.push({
        id: `checklist:${list.slug}`,
        href: '/lists/import',
        family: 'checklist',
        source: 'official-list',
        specificity: 'guide',
        priority: 0,
        imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/transferlog-icon.svg',
        trackEvent: 'related-link',
        trackEventLabel: 'item-lists',
        children: t.rich('ItemPage.create-your-0-checklist', {
          0: list.name,
          b: (chunk) => <b>{chunk}</b>,
        }),
      });

      return;
    }

    if (
      !stampAlbumAdded &&
      list.officialTag.some((officialTag) => officialTag.toLowerCase() === 'stamps') &&
      list.visibility === 'public'
    ) {
      stampAlbumAdded = true;
      const stampAlbumName = t('General.stamp-album');
      checklistLinks.push({
        id: 'checklist:stamp-album',
        href: '/lists/import',
        family: 'checklist',
        source: 'official-list-tag',
        specificity: 'guide',
        priority: 0,
        imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/stamps-icon.svg',
        trackEvent: 'related-link',
        trackEventLabel: 'item-lists',
        children: t.rich('ItemPage.create-your-0-checklist', {
          0: stampAlbumName,
          b: (chunk) => <b>{chunk}</b>,
        }),
      });
    }
  });

  const petpetColorEffect = itemEffects?.find((effect) => effect.type === 'petpetColor');
  const colorId =
    petpetColorEffect?.colorTargetId ??
    getPetpetMapIdByName(petpetColorEffect?.colorTarget || '', petpetColorMaps) ??
    petpetData?.color.id;
  const petpetColor =
    petpetColorEffect?.colorTarget ||
    petpetData?.color.name ||
    (colorId != null ? `#${colorId}` : null);

  if (colorId && petpetColor && petpetColor !== 'Unknown' && petpetColor !== 'No Color') {
    petpetLinks.push({
      id: `petpet:color:${colorId}`,
      href: `/search?s=&petpetColor[]=${colorId}`,
      family: 'petpet',
      source: petpetColorEffect ? 'item-effect' : 'petpet-data',
      specificity: 'browse',
      priority: 0,
      imageUrl:
        'https://images.neopets.com/themes/h5/hauntedwoods/images/community-icon.svg?d=20210209',
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-color',
      children: t('ItemPage.all-x-petpets', { 0: petpetColor }),
    });
  }

  const petpetSpeciesName =
    petpetData?.species.name || getPetpetSpeciesNameFromItemName(item.name, petpetSpeciesMaps);
  const specieId =
    petpetData?.species.id ?? getPetpetMapIdByName(petpetSpeciesName ?? '', petpetSpeciesMaps);

  if (petpetSpeciesName && specieId) {
    petpetLinks.push({
      id: `petpet:species:${specieId}`,
      href: `/search?s=&petpetSpecies[]=${specieId}`,
      family: 'petpet',
      source: petpetData?.species.name ? 'petpet-data' : 'item-name',
      specificity: 'browse',
      priority: 10,
      imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/adoptpet-icon.svg',
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-species',
      children: t('ItemPage.all-x-petpets', { 0: petpetSpeciesName }),
    });
  }

  if (item.isNC && item.status === 'active') {
    ncLinks.push({
      id: 'nc:guide:trading',
      href: '/articles/nc-trading-guide',
      family: 'nc',
      source: 'item-status',
      specificity: 'guide',
      priority: 0,
      imageUrl: '/icons/giftbox.png',
      trackEvent: 'related-link',
      trackEventLabel: 'nc-trading-guide',
      children: t.rich('ItemPage.related-nc-trading-guide', {
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  }

  return resolveRelatedLinkCandidates([
    ...rainbowLinks,
    ...outfitLinks,
    ...petStyleLinks,
    ...checklistLinks,
    ...petpetLinks,
    ...ncLinks,
  ]);
}
