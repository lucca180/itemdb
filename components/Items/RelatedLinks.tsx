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
  const [t, itemEffects, lists, petpetData, petStyle, petpetSpeciesMaps, petpetColorMaps] =
    await Promise.all([
      getTranslations(),
      loadItemEffects(item.internal_id),
      getOfficialItemLists(item.internal_id, shouldShowTradeLists(item, await getCachedNow())),
      loadPetpetData(item.internal_id),
      loadPetStyleForItem(item.internal_id),
      getPetpetSpeciesMaps(),
      getPetpetColorMaps(),
    ]);
  const relatedLinks = buildRelatedLinks(item, t, {
    itemEffects,
    lists,
    petpetData: petpetData || undefined,
    petStyle,
    petpetSpeciesMaps,
    petpetColorMaps,
  });
  const color = item.color.rgb;

  if (relatedLinks.length === 0) return null;

  return (
    <CardBase title={t('ItemPage.related-links')} color={color} chakra={{ p: 2 }}>
      <Flex gap={1} flexFlow="column">
        {relatedLinks.map((link) => (
          <ChakraLink
            key={`${link.href}-${link.trackEventLabel}-${link.alt}`}
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

function pushUniqueLink(links: RelatedLinkProps[], hrefs: Set<string>, link: RelatedLinkProps) {
  if (hrefs.has(link.href)) return;
  hrefs.add(link.href);
  links.push(link);
}

type RelatedLinkProps = {
  href: string;
  alt: string;
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
};

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function buildRelatedLinks(item: ItemData, t: Translate, rest: RelatedOthers) {
  const { itemEffects, lists, petpetData, petStyle, petpetSpeciesMaps, petpetColorMaps } = rest;
  const rainbowLinks: RelatedLinkProps[] = [];
  const outfitLinks: RelatedLinkProps[] = [];
  const petStyleLinks: RelatedLinkProps[] = [];
  const checklistLinks: RelatedLinkProps[] = [];
  const petpetLinks: RelatedLinkProps[] = [];
  const rainbowHrefs = new Set<string>();
  const petStyleHrefs = new Set<string>();
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

  comboEffects.forEach((effect) => {
    const speciesTarget = effect.speciesTarget!;
    const colorTarget = effect.colorTarget!;
    pushUniqueLink(rainbowLinks, rainbowHrefs, {
      href: `/rainbow-pool/${petColorSlug(speciesTarget)}/${petColorSlug(colorTarget)}`,
      imageUrl: getSpeciesImage(speciesTarget),
      alt: `${colorTarget} ${speciesTarget}`,
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
      pushUniqueLink(rainbowLinks, rainbowHrefs, {
        href: `/rainbow-pool/${petColorSlug(speciesName)}`,
        imageUrl: getSpeciesImage(speciesName),
        alt: speciesName,
        trackEvent: 'related-link',
        trackEventLabel: 'rainbow-pool',
        children: browseSpeciesTitle(t, speciesName),
      });
    }

    outfitLinks.push({
      href: `/hub/outfits/${speciesName?.toLowerCase()}`,
      imageUrl: '/icons/closet.svg',
      alt: speciesName,
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
      pushUniqueLink(rainbowLinks, rainbowHrefs, {
        href: `/rainbow-pool/${targetSlug}`,
        imageUrl: item.image,
        alt: target,
        trackEvent: 'related-link',
        trackEventLabel: isColor ? 'color-painting' : 'species-painting',
        children: isColor ? browseColorTitle(t, target) : browseSpeciesTitle(t, target),
      });
    });

  if (petStyle) {
    const href = petStyle.colorName
      ? stylesComboHref(petStyle.speciesName, petStyle.colorName)
      : stylesUnknownHref(petStyle.speciesName);
    pushUniqueLink(petStyleLinks, petStyleHrefs, {
      href,
      imageUrl: STYLING_STUDIO_ICON,
      alt: petStyle.speciesName,
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
    pushUniqueLink(petStyleLinks, petStyleHrefs, {
      href: stylesComboHref(speciesTarget, colorTarget),
      imageUrl: STYLING_STUDIO_ICON,
      alt: `${colorTarget} ${speciesTarget}`,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles-combo',
      children: t.rich('PetStyles.related-combo-styles', {
        combo: `${colorTarget} ${speciesTarget}`,
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  });

  if (isStudioEssentialItemName(item.name)) {
    pushUniqueLink(petStyleLinks, petStyleHrefs, {
      href: STYLES_BASE_PATH,
      imageUrl: STYLING_STUDIO_ICON,
      alt: t('PetStyles.hub-h1'),
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles-hub',
      children: t.rich('PetStyles.related-supplies-hub', {
        b: (chunk) => <b>{chunk}</b>,
      }),
    });
  }

  if (speciesName && !comboSpeciesSlugs.has(petColorSlug(speciesName))) {
    pushUniqueLink(petStyleLinks, petStyleHrefs, {
      href: stylesBrowseHref(speciesName),
      imageUrl: STYLING_STUDIO_ICON,
      alt: speciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles',
      children: t('PetStyles.all-species-styles', { species: speciesName }),
    });
  }

  colorSpeciesEffects.forEach((effect) => {
    if (!effect.colorTarget) return;
    if (comboColorSlugs.has(petColorSlug(effect.colorTarget))) return;
    pushUniqueLink(petStyleLinks, petStyleHrefs, {
      href: stylesBrowseHref(effect.colorTarget),
      imageUrl: STYLING_STUDIO_ICON,
      alt: effect.colorTarget,
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
        href: '/lists/import',
        imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/transferlog-icon.svg',
        alt: list.name,
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
      checklistLinks.push({
        href: '/lists/import',
        imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/stamps-icon.svg',
        alt: 'Stamp Album',
        trackEvent: 'related-link',
        trackEventLabel: 'item-lists',
        children: t.rich('ItemPage.create-your-0-checklist', {
          0: 'Stamp Album',
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

  if (colorId && petpetColor) {
    petpetLinks.push({
      href: `/search?s=&petpetColor[]=${colorId}`,
      imageUrl:
        'https://images.neopets.com/themes/h5/hauntedwoods/images/community-icon.svg?d=20210209',
      alt: petpetColor,
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-color',
      children: t('ItemPage.all-x-petpets', { 0: petpetColor }),
    });
  }

  const petpetSpeciesName = getPetpetSpeciesNameFromItemName(item.name, petpetSpeciesMaps);
  const specieId = getPetpetMapIdByName(petpetSpeciesName ?? '', petpetSpeciesMaps);

  if (petpetSpeciesName && specieId) {
    petpetLinks.push({
      href: `/search?s=&petpetSpecies[]=${specieId}`,
      imageUrl: 'https://images.neopets.com/themes/h5/basic/images/v3/adoptpet-icon.svg',
      alt: petpetSpeciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-species',
      children: t('ItemPage.all-x-petpets', { 0: petpetSpeciesName }),
    });
  }

  return [...rainbowLinks, ...outfitLinks, ...petStyleLinks, ...checklistLinks, ...petpetLinks];
}
