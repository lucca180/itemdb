import { Flex } from '@chakra-ui/react';
import { ItemData, ItemEffect } from '@types';
import CardBase from '@components/Card/CardBase';
import Color from 'color';
import { getLocale, getTranslations } from 'next-intl/server';
import { EffectCard } from '@components/Items/EffectCard';
import { EffectTypes } from '@components/Items/effectTypes';

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
          const meta = EffectTypes[effect.type as keyof typeof EffectTypes];
          const localeKey = locale === 'pt' ? 'name_pt' : 'name_en';
          const typeName = meta?.[localeKey] ?? effect.type;

          return <EffectCard key={i} effect={effect} typeName={typeName} />;
        })}
      </Flex>
    </CardBase>
  );
}

export { EffectCard, EffectText, EffectTypes } from '@components/Items/EffectCard';
