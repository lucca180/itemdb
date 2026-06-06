import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { Flex, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getMMEData, isMME } from '@pages/api/v1/items/[id_name]/mme';
import { getTranslations } from 'next-intl/server';
import type { ItemData, ItemMMEData } from '@types';

type Props = {
  item: ItemData;
};

const loadMMEData = unstable_cache(
  async (internalId: number): Promise<ItemMMEData | null> => {
    const cachedItem = await getItem(internalId, true);
    if (!cachedItem || !isMME(cachedItem.name)) return null;
    return getMMEData(cachedItem);
  },
  ['item-mme'],
  { revalidate: 60 * 60 }
);

export async function MMECard({ item }: Props) {
  if (!isMME(item.name)) return null;

  return (
    <Suspense fallback={null}>
      <MMECardContent item={item} />
    </Suspense>
  );
}

async function MMECardContent({ item }: Props) {
  const [mmeData, t] = await Promise.all([loadMMEData(item.internal_id), getTranslations()]);
  if (!mmeData) return null;

  const trails = Object.keys(mmeData.trails).map((trail) => ({
    key: trail,
    label: t('ItemPage.mme-trail', { x: trail.toUpperCase() }),
    items: mmeData.trails[trail],
  }));

  return (
    <CardBase title={`${mmeData.name} Info`} color={item.color.rgb}>
      <Flex gap={3} wrap="wrap" alignItems="center" flexFlow={'column'}>
        <Text fontSize={'sm'} textAlign={'center'}>
          {t.rich('ItemPage.mme-text', {
            b: (children) => <b>{children}</b>,
            name: mmeData.name,
            isMini: mmeData.isMini.toString(),
          })}
        </Text>
        <Flex wrap="wrap" gap={2} alignItems="center" justifyContent={'center'}>
          {trails.map((trail) => (
            <Flex
              key={trail.key}
              direction="column"
              gap={2}
              bg="blackAlpha.500"
              p={3}
              borderRadius={'md'}
            >
              <Text>
                <b>{trail.label}</b>
              </Text>
              <Flex wrap="wrap" gap={2} justifyContent={'center'}>
                <ItemCard
                  uniqueID={`mme-initial-${mmeData.initial.internal_id}`}
                  item={mmeData.initial}
                  small
                />
                {trail.items.map((trailItem) => (
                  <ItemCard
                    uniqueID={`mme-trail-${trail.key}-${trailItem.internal_id}`}
                    key={trailItem.internal_id}
                    item={trailItem}
                    small
                  />
                ))}
              </Flex>
            </Flex>
          ))}
        </Flex>
        <Text fontSize={'sm'} textAlign={'center'}>
          {t.rich('ItemPage.mme-chance', {
            b: (children) => <b>{children}</b>,
          })}
        </Text>
        <ItemCard
          uniqueID={`mme-bonus-${mmeData.bonus.internal_id}`}
          item={mmeData.bonus}
          small
          isLE
        />
      </Flex>
    </CardBase>
  );
}

export default MMECard;
