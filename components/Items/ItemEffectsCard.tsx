import { Flex } from '@chakra-ui/react';
import { ItemData, ItemEffect } from '@types';
import CardBase from '@components/Card/CardBase';
import Color from 'color';
import { getLocale, getTranslations } from 'next-intl/server';
import { EffectCard, EffectTypes } from '@components/Items/EffectCard';

type Props = {
  item: ItemData;
  effects: ItemEffect[];
};

export default async function ItemEffectsCard(props: Props) {
  const t = await getTranslations();
  const locale = await getLocale();
  const { item, effects } = props;
  const color = Color(item.color.hex);

  return (
    <CardBase title={t('ItemPage.item-effects')} color={color.hex()}>
      <Flex
        gap={3}
        flexFlow="row"
        justifyContent="center"
        flexWrap={'wrap'}
        css={{ '& a': { color: color.lightness(70).hex() } }}
      >
        {effects.map((effect, i) => {
          const effectType = effect.type;
          //@ts-expect-error ts is dumb
          const typeName = EffectTypes[effectType][`name_${locale}`];

          return <EffectCard key={i} effect={effect} typeName={typeName} />;
        })}
      </Flex>
    </CardBase>
  );
}

export { EffectCard, EffectText, EffectTypes } from '@components/Items/EffectCard';
