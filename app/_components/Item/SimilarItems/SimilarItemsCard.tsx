import { Suspense } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import { SimilarItemsCardFallbackShell } from '@app/_components/Item/SimilarItems/SimilarItemsCardFallbackShell';
import { loadSimilarItemData } from '@app/_components/Item/SimilarItems/loadSimilarItems';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function SimilarItemsCard({ item }: Props) {
  const t = await getTranslations();
  const fallback = <SimilarItemsCardFallbackShell item={item} title={t('ItemPage.suggestion')} />;

  return (
    <Suspense fallback={fallback}>
      <SimilarItemsCardContent item={item} />
    </Suspense>
  );
}

async function SimilarItemsCardContent({ item }: Props) {
  const [similarItemData, t] = await Promise.all([loadSimilarItemData(item), getTranslations()]);

  return (
    <CardBase title={t('ItemPage.suggestion')} color={item.color.rgb}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {similarItemData.map((similarItem) => (
          <ItemCard
            uniqueID="similar-items"
            utm_content="similar_items"
            disablePrefetch
            key={similarItem.internal_id}
            item={similarItem}
          />
        ))}
        {similarItemData.length === 0 && <Text fontSize="sm">{t('ItemPage.suggestion-fail')}</Text>}
      </Flex>
    </CardBase>
  );
}

export default SimilarItemsCard;
