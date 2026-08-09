import { Suspense } from 'react';
import { Flex, Image, Text } from '@chakra-ui/react';
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
import { browseSpeciesTitle } from '@utils/petColorCopy';
import {
  getPetpetColorId,
  getPetpetSpeciesFromString,
  getPetpetSpeciesId,
  getSpeciesFromString,
  petColorSlug,
} from '@utils/pet-utils';
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
  const [t, itemEffects, lists, petpetData, petStyle] = await Promise.all([
    getTranslations(),
    loadItemEffects(item.internal_id),
    getOfficialItemLists(item.internal_id, shouldShowTradeLists(item, await getCachedNow())),
    loadPetpetData(item.internal_id),
    loadPetStyleForItem(item.internal_id),
  ]);
  const relatedLinks = buildRelatedLinks(item, t, {
    itemEffects,
    lists,
    petpetData: petpetData || undefined,
    petStyle,
  });
  const color = item.color.rgb;

  if (relatedLinks.length === 0) return null;

  return (
    <CardBase title={t('ItemPage.related-links')} color={color}>
      <Flex gap={3} wrap="wrap" flexFlow={'column'}>
        {relatedLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            data-umami-event={link.trackEvent}
            data-umami-event-label={link.trackEventLabel}
          >
            <Text
              fontSize={'sm'}
              bg="whiteAlpha.200"
              p={2}
              borderRadius={5}
              display={'inline-flex'}
              alignItems={'center'}
              gap={2}
              w="100%"
            >
              <Image
                verticalAlign={'sub'}
                display="inline"
                src={link.imageUrl}
                width={'26px'}
                height={'26px'}
                alt={link.alt}
              />
              <span>{link.children}</span>
            </Text>
          </Link>
        ))}
      </Flex>
    </CardBase>
  );
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
};

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function buildRelatedLinks(item: ItemData, t: Translate, rest: RelatedOthers) {
  const { itemEffects, lists, petpetData, petStyle } = rest;
  const relatedLinks: RelatedLinkProps[] = [];

  if (petStyle) {
    const href = petStyle.colorName
      ? stylesComboHref(petStyle.speciesName, petStyle.colorName)
      : stylesUnknownHref(petStyle.speciesName);
    relatedLinks.push({
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

  if (isStudioEssentialItemName(item.name)) {
    relatedLinks.push({
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

  const speciesName = getSpeciesFromString(item.name);
  const colorEffect = itemEffects?.filter(
    (effect) => effect.type === 'colorSpecies' && effect.colorTarget
  );

  if (speciesName) {
    let img = `https://images.neopets.com/community/hub/calendar/events/${speciesName.toLowerCase()}.png`;
    if (speciesName.toLowerCase() === 'varwolf') {
      img = `/icons/varwolf.png`;
    }
    if (speciesName.toLowerCase() === 'vandagyre') {
      img = `https://images.neopets.com/neoboards/smilies/vandagyre.gif`;
    }

    relatedLinks.push({
      href: `/rainbow-pool/${petColorSlug(speciesName)}`,
      imageUrl: img,
      alt: speciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'rainbow-pool',
      children: browseSpeciesTitle(t, speciesName),
    });

    relatedLinks.push({
      href: `/hub/outfits/${speciesName?.toLowerCase()}`,
      imageUrl: `/icons/closet.svg`,
      alt: speciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'exclusive-clothes',
      children: t.rich('ItemPage.exclusive-0-clothes-guide', {
        0: speciesName,
        b: (chunk) => <b>{chunk}</b>,
      }),
    });

    relatedLinks.push({
      href: stylesBrowseHref(speciesName),
      imageUrl: STYLING_STUDIO_ICON,
      alt: speciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'pet-styles',
      children: t('PetStyles.all-species-styles', { species: speciesName }),
    });
  }

  const isUnbuyable = (item.price?.value ?? 0) > 999999;

  if (isUnbuyable) {
    relatedLinks.push({
      href: `/tools/price-calculator`,
      imageUrl: `https://images.neopets.com/themes/h5/basic/images/myshop-icon.png`,
      alt: '',
      trackEvent: 'related-link',
      trackEventLabel: 'price-calculator',
      children: t('ItemPage.price-calculator-tool'),
    });
  }

  if (colorEffect && colorEffect.length > 0) {
    colorEffect.forEach((effect) => {
      const colorTarget = effect.colorTarget!;
      relatedLinks.push({
        href: `/rainbow-pool/${petColorSlug(colorTarget)}`,
        imageUrl: STYLING_STUDIO_ICON,
        alt: colorTarget,
        trackEvent: 'related-link',
        trackEventLabel: 'color-painting',
        children: t.rich('ItemPage.related-painting', {
          color: colorTarget,
          b: (chunk) => <b>{chunk}</b>,
        }),
      });

      relatedLinks.push({
        href: stylesBrowseHref(colorTarget),
        imageUrl: STYLING_STUDIO_ICON,
        alt: colorTarget,
        trackEvent: 'related-link',
        trackEventLabel: 'pet-styles',
        children: t('PetStyles.all-color-styles', { color: colorTarget }),
      });
    });
  }

  const checklists = ['gourmet-food', 'neodeck', 'book-award', 'booktastic-book-award'];
  lists?.forEach((list) => {
    if (!list.official) return;

    if (list.slug && checklists.includes(list.slug)) {
      relatedLinks.push({
        href: `/lists/import`,
        imageUrl: `https://images.neopets.com/themes/h5/basic/images/v3/transferlog-icon.svg`,
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
      list.officialTag.some((officialTag) => officialTag.toLowerCase() === 'stamps') &&
      list.visibility === 'public'
    ) {
      relatedLinks.push({
        href: `/lists/import`,
        imageUrl: `https://images.neopets.com/themes/h5/basic/images/v3/stamps-icon.svg`,
        alt: list.name,
        trackEvent: 'related-link',
        trackEventLabel: 'item-lists',
        children: t.rich('ItemPage.create-your-0-checklist', {
          0: 'Stamp Album',
          b: (chunk) => <b>{chunk}</b>,
        }),
      });
    }
  });

  const petpetColor =
    itemEffects?.find((effect) => effect.type === 'petpetColor')?.colorTarget ||
    petpetData?.color.name;
  const colorId = getPetpetColorId(petpetColor || '') || petpetData?.color.id;

  if (colorId && petpetColor) {
    relatedLinks.push({
      href: `/search?s=&petpetColor[]=${colorId}`,
      imageUrl: `https://images.neopets.com/themes/h5/hauntedwoods/images/community-icon.svg?d=20210209`,
      alt: petpetColor,
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-color',
      children: t('ItemPage.all-x-petpets', { 0: petpetColor }),
    });
  }

  const petpetSpecies = getPetpetSpeciesFromString(item.name);
  const specieId = getPetpetSpeciesId(petpetSpecies ?? '');

  if (petpetSpecies && specieId) {
    relatedLinks.push({
      href: `/search?s=&petpetSpecies[]=${specieId}`,
      imageUrl: `https://images.neopets.com/themes/h5/basic/images/v3/adoptpet-icon.svg`,
      alt: petpetSpecies,
      trackEvent: 'related-link',
      trackEventLabel: 'petpet-species',
      children: t('ItemPage.all-x-petpets', { 0: petpetSpecies }),
    });
  }

  return relatedLinks;
}
