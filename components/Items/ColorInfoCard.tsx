import CardBase from '@components/Card/CardBase';
import { getTranslations } from 'next-intl/server';
import { ColorInfoCardPalette } from '@components/Items/ColorInfoCardPalette';
import type { ItemColorMap, ItemData } from '@types';

type Props = {
  item: ItemData;
  colors: ItemColorMap;
};

export default async function ColorInfoCard(props: Props) {
  const t = await getTranslations();
  const { item, colors } = props;
  const color = item.color?.hex;

  return (
    <CardBase
      title={t('ItemPage.color-palette')}
      color={color}
      chakra={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ColorInfoCardPalette
        colors={colors}
        labels={{
          invisibleItem: t('ItemPage.invisible-item'),
          showMore: t('ItemPage.show-more'),
          showLess: t('ItemPage.show-less'),
          copiedToClipboard: t('Layout.copied-to-clipboard'),
        }}
      />
    </CardBase>
  );
}
