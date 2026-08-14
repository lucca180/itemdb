import { Suspense } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import ItemCard from '@components/Items/ItemCard';
import MainLink from '@components/Utils/MainLink';
import { needsDye } from '@app/_components/Item/itemPageGates';
import {
  loadDyeData,
  loadPetStyleForItem,
  type PetStyleLinkData,
} from '@app/_components/Item/loadUtils';
import type { DyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import { getTranslations } from 'next-intl/server';
import { stylesComboHref, stylesUnknownHref } from '@utils/petStyles/paths';
import type { ItemData } from '@types';
import type { ReactNode } from 'react';

type Props = {
  item: ItemData;
};

type DyeCardType = 'dyeworks' | 'prismatic' | 'none';

function getDyeCardType(dyeData: DyeworksData): DyeCardType {
  if (dyeData.originalItem.name.toLowerCase().includes('dyeworks')) return 'dyeworks';
  if (dyeData.originalItem.name.toLowerCase().includes('prismatic')) return 'prismatic';

  if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('dyeworks'))) return 'dyeworks';
  if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('prismatic'))) return 'prismatic';

  return 'none';
}

function petStylesComboHref(petStyle: PetStyleLinkData): string {
  if (!petStyle.colorName) return stylesUnknownHref(petStyle.speciesName);
  return stylesComboHref(petStyle.speciesName, petStyle.colorName);
}

async function loadPrismaticPetStyle(
  itemId: number,
  originalItemId: number
): Promise<PetStyleLinkData | null> {
  if (itemId === originalItemId) return loadPetStyleForItem(itemId);

  const [current, original] = await Promise.all([
    loadPetStyleForItem(itemId),
    loadPetStyleForItem(originalItemId),
  ]);

  return current ?? original;
}

export async function DyeCard({ item }: Props) {
  if (!needsDye(item)) return null;

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
  const petStyle =
    type === 'prismatic'
      ? await loadPrismaticPetStyle(item.internal_id, dyeData.originalItem.internal_id)
      : null;
  const comboHref = petStyle ? petStylesComboHref(petStyle) : null;

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
              b: (c: ReactNode) => <b>{c}</b>,
            })}
          {!isOriginal &&
            t.rich(`DyeCard.${type}-is-variation`, {
              b: (c: ReactNode) => <b>{c}</b>,
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
              {dyeData.dyes.map((dye: ItemData) => (
                <ItemCard uniqueID="dyeworks-variant" key={dye.internal_id} item={dye} small />
              ))}
            </Flex>
          </Flex>
        </Flex>
        {comboHref && petStyle && (
          <Button asChild size="sm" fontWeight="semibold">
            <MainLink href={comboHref} trackEvent="dye-card" trackEventLabel="pet-styles-combo">
              {petStyle.colorName
                ? t('DyeCard.all-combo-styles', {
                    color: petStyle.colorName,
                    species: petStyle.speciesName,
                  })
                : t('DyeCard.all-species-styles', { species: petStyle.speciesName })}
            </MainLink>
          </Button>
        )}
      </Flex>
    </CardBase>
  );
}

export default DyeCard;
