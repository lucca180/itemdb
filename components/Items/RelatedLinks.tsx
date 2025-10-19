import { Flex, Text, Image } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemEffect } from '../../types';
import CardBase from '../Card/CardBase';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import { getSpeciesFromString } from '@utils/pet-utils';

type Props = {
  item: ItemData;
  itemEffects?: ItemEffect[];
};

const RelatedLinksCard = (props: Props) => {
  const t = useTranslations();
  const { item, itemEffects } = props;
  const color = item.color.rgb;
  const speciesName = getSpeciesFromString(item.name);
  const colorEffect = itemEffects?.filter(
    (effect) => effect.type === 'colorSpecies' && effect.colorTarget
  );
  const isUnbuyable = (item.price?.value ?? 0) > 999999;

  if (!isUnbuyable && !speciesName && (!colorEffect || colorEffect.length === 0)) return null;

  return (
    <CardBase title={t('ItemPage.related-links')} color={color}>
      <Flex gap={3} wrap="wrap" flexFlow={'column'}>
        {speciesName && (
          <>
            <RelatedLink
              href={`/tools/rainbow-pool/${speciesName?.toLowerCase()}`}
              imageUrl={`https://images.neopets.com/community/hub/calendar/events/${speciesName.toLowerCase()}.png`}
              alt={speciesName}
              trackEvent="related-link"
              trackEventLabel="rainbow-pool"
            >
              {t('PetColors.species-title', { 0: speciesName })}
            </RelatedLink>
            <RelatedLink
              href={`/hub/outfits/${speciesName?.toLowerCase()}`}
              imageUrl={`/icons/closet.svg`}
              alt={speciesName}
              trackEvent="related-link"
              trackEventLabel="exclusive-clothes"
            >
              {t.rich('ItemPage.exclusive-0-clothes-guide', {
                0: speciesName,
                b: (chunk) => <b>{chunk}</b>,
              })}
            </RelatedLink>
          </>
        )}
        {isUnbuyable && (
          <RelatedLink
            href={`/tools/price-calculator`}
            imageUrl={`https://images.neopets.com/themes/h5/basic/images/myshop-icon.png`}
            alt=""
            trackEvent="related-link"
            trackEventLabel="price-calculator"
          >
            {t('ItemPage.price-calculator-tool')}
          </RelatedLink>
        )}
        {colorEffect &&
          colorEffect.length > 0 &&
          colorEffect.map((effect) => (
            <RelatedLink
              key={effect.internal_id}
              href={`/tools/rainbow-pool/${effect.colorTarget!.toLowerCase()}`}
              imageUrl={`https://images.neopets.com/themes/h5/basic/images/stylingstudio-icon.png`}
              alt={effect.colorTarget!}
              trackEvent="related-link"
              trackEventLabel="color-painting"
            >
              {t.rich('ItemPage.related-painting', {
                color: effect.colorTarget!,
                b: (chunk) => <b>{chunk}</b>,
              })}
            </RelatedLink>
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
