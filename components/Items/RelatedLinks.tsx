import { Flex, Text, Image } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemEffect, ItemPetpetData, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
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

const RelatedLinksCard = (props: Props) => {
  const t = useTranslations();
  const relatedLinks = useRelatedLinks(props.item, {
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
          <RelatedLink key={index} {...link} />
        ))}
      </Flex>
    </CardBase>
  );
};

export default RelatedLinksCard;

type RelatedLinkProps = {
  href: string;
  alt: string;
  imageUrl: string;
  children: React.ReactNode;
  trackEvent?: string;
  trackEventLabel?: string;
};

const RelatedLink = (props: RelatedLinkProps) => {
  const { href, alt, imageUrl, children, trackEvent, trackEventLabel } = props;
  return (
    <MainLink href={href} trackEvent={trackEvent} trackEventLabel={trackEventLabel}>
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
          src={imageUrl}
          width={'26px'}
          height={'26px'}
          alt={alt}
        />
        <span>{children}</span>
      </Text>
    </MainLink>
  );
};

type RelatedOthers = {
  itemEffects?: ItemEffect[];
  lists?: UserList[];
  petpetData?: ItemPetpetData;
};

const useRelatedLinks = (item: ItemData, rest: RelatedOthers) => {
  const t = useTranslations();
  const { itemEffects, lists, petpetData } = rest;
  const relatedLinks: RelatedLinkProps[] = [];

  // ------ Species Related Links ------ //
  const speciesName = getSpeciesFromString(item.name);
  const colorEffect = itemEffects?.filter(
    (effect) => effect.type === 'colorSpecies' && effect.colorTarget
  );

  if (speciesName) {
    relatedLinks.push({
      href: `/tools/rainbow-pool/${speciesName?.toLowerCase()}`,
      imageUrl: `https://images.neopets.com/community/hub/calendar/events/${speciesName.toLowerCase()}.png`,
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

  // ------ Price Related Links ------ //
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

  // ------ Color Related Links ------ //
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

  // ------ Lists Related Links ------ //
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

    if (list.officialTag?.toLowerCase() === 'stamps' && list.visibility === 'public') {
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

  // ------ Petpet Related Links ------ //
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
};
