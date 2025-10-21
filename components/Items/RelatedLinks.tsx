import { Flex, Text, Image } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemEffect, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import { getSpeciesFromString } from '@utils/pet-utils';

type Props = {
  item: ItemData;
  itemEffects?: ItemEffect[];
  lists?: UserList[];
};

const RelatedLinksCard = (props: Props) => {
  const t = useTranslations();
  const relatedLinks = useRelatedLinks(props.item, {
    itemEffects: props.itemEffects,
    lists: props.lists,
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
};

const useRelatedLinks = (item: ItemData, rest: RelatedOthers) => {
  const t = useTranslations();
  const { itemEffects, lists } = rest;
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
  return relatedLinks;
};
