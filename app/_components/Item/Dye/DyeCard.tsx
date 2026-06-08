import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { Flex, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import { getCachedItem } from '@app/_components/Item/loadUtils';
import { getDyeworksData, type DyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import { getTranslations } from 'next-intl/server';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

type DyeCardType = 'dyeworks' | 'prismatic' | 'none';

async function loadDyeData(internalId: number): Promise<DyeworksData | null> {
  'use cache';
  applyItemSectionCacheTags(internalId, 'dye');
  cacheLife('itemSection');
  const cachedItem = await getCachedItem(internalId, true);
  if (!cachedItem?.isNC || !cachedItem.isWearable) return null;
  return getDyeworksData(cachedItem);
}

function getDyeCardType(dyeData: DyeworksData): DyeCardType {
  if (dyeData.originalItem.name.toLowerCase().includes('dyeworks')) return 'dyeworks';
  if (dyeData.originalItem.name.toLowerCase().includes('prismatic')) return 'prismatic';

  if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('dyeworks'))) return 'dyeworks';
  if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('prismatic'))) return 'prismatic';

  return 'none';
}

export async function DyeCard({ item }: Props) {
  if (!item.isNC || !item.isWearable) return null;

  return (
    <Suspense fallback={null}>
      <DyeCardContent item={item} />
    </Suspense>
  );
}

async function DyeCardContent({ item }: Props) {
  const [dyeData, t] = await Promise.all([loadDyeData(item.internal_id), getTranslations()]);
  if (!dyeData) return null;

  const type = getDyeCardType(dyeData);
  const isOriginal = item.internal_id === dyeData.originalItem.internal_id;

  return (
    <CardBase
      title={type === 'dyeworks' ? 'Dyeworks Info' : 'Prismatic Info'}
      color={item.color.rgb}
    >
      <Flex
        gap={3}
        wrap="wrap"
        fontSize={'sm'}
        textAlign={'center'}
        alignItems="center"
        flexFlow={'column'}
        justifyContent={'center'}
      >
        <Text>
          {isOriginal &&
            t.rich(`DyeCard.${type}-x-variations`, {
              x: dyeData.dyes.length,
              b: (c) => <b>{c}</b>,
            })}
          {!isOriginal &&
            t.rich(`DyeCard.${type}-is-variation`, {
              b: (c) => <b>{c}</b>,
            })}
        </Text>
        <Flex wrap="wrap" gap={2} justifyContent={'center'}>
          <Flex
            direction="column"
            gap={2}
            justifyContent="center"
            bg="blackAlpha.500"
            p={3}
            borderRadius={'md'}
          >
            <Text>{t('DyeCard.dyeworks-original-item')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              <ItemCard
                uniqueID="dyeworks-original-item"
                key={dyeData.originalItem.internal_id}
                item={dyeData.originalItem}
                small
              />
            </Flex>
          </Flex>
          <Flex
            direction="column"
            justifyContent="center"
            gap={2}
            bg="blackAlpha.500"
            p={3}
            borderRadius={'md'}
          >
            <Text>{t('DyeCard.dyeworks-all-variants')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              {dyeData.dyes.map((dye) => (
                <ItemCard uniqueID="dyeworks-variant" key={dye.internal_id} item={dye} small />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </CardBase>
  );
}

export default DyeCard;
