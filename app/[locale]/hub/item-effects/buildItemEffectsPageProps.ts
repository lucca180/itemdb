import { getTranslations } from 'next-intl/server';

export const ITEM_EFFECTS_STATS = [
  'Max HP',
  'Strength',
  'Level',
  'Defence',
  'Movement',
  'Intelligence',
  'Weight',
  'Height',
] as const;

export type ItemEffectsField =
  | 'stats'
  | 'disease'
  | 'cureDisease'
  | 'heal'
  | 'colorSpecies'
  | 'other';

export type ItemEffectsPageLabels = {
  heading: string;
  cta: string;
  allStatsLabel: string;
  statsOptions: readonly string[];
  typeButtons: Record<ItemEffectsField, string>;
  emptyMessage: string;
  prevPage: string;
  nextPage: string;
};

export async function buildItemEffectsPageProps(): Promise<ItemEffectsPageLabels> {
  const t = await getTranslations();

  return {
    heading: t('ItemEffects.item-effect-hub'),
    cta: t('ItemEffects.cta'),
    allStatsLabel: 'All Stats',
    statsOptions: ITEM_EFFECTS_STATS,
    typeButtons: {
      stats: t('ItemEffects.stats-change'),
      disease: t('ItemEffects.disease'),
      cureDisease: t('ItemEffects.cure-disease'),
      heal: t('ItemEffects.heal-hp'),
      colorSpecies: t('ItemEffects.color-species-change'),
      other: t('ItemEffects.other'),
    },
    emptyMessage: t('ItemEffects.empty-msg'),
    prevPage: t('MissingHub.prev-page'),
    nextPage: t('MissingHub.next-page'),
  };
}
