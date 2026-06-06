import { Flex, Image, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { ItemData, ItemEffect, ItemPetpetData, UserList } from '@types';
import CardBase from '@components/Card/CardBase';
import { getTranslations } from 'next-intl/server';
import { Link } from '@i18n/navigation';
import {
  getPetpetColorId,
  getPetpetSpeciesFromString,
  getPetpetSpeciesId,
  getSpeciesFromString,
} from '@utils/pet-utils';

type Props = {
  item: ItemData;
  itemEffects?: ItemEffect[];
  lists?: UserList[];
  petpetData?: ItemPetpetData | null;
};

export default async function RelatedLinksCard(props: Props) {
  const t = await getTranslations();
  const relatedLinks = buildRelatedLinks(props.item, t, {
    itemEffects: props.itemEffects,
    lists: props.lists,
    petpetData: props.petpetData || undefined,
  });
  const { item } = props;
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
};

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function buildRelatedLinks(item: ItemData, t: Translate, rest: RelatedOthers) {
  const { itemEffects, lists, petpetData } = rest;
  const relatedLinks: RelatedLinkProps[] = [];

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
      href: `/tools/rainbow-pool/${speciesName?.toLowerCase()}`,
      imageUrl: img,
      alt: speciesName,
      trackEvent: 'related-link',
      trackEventLabel: 'rainbow-pool',
      children: t('PetColors.species-title', { 0: speciesName }),
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
      relatedLinks.push({
        href: `/tools/rainbow-pool/${effect.colorTarget!.toLowerCase()}`,
        imageUrl: `https://images.neopets.com/themes/h5/basic/images/stylingstudio-icon.png`,
        alt: effect.colorTarget!,
        trackEvent: 'related-link',
        trackEventLabel: 'color-painting',
        children: t.rich('ItemPage.related-painting', {
          color: effect.colorTarget!,
          b: (chunk) => <b>{chunk}</b>,
        }),
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
