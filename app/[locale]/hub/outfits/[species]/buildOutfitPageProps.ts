import { getTranslations } from 'next-intl/server';

export type OutfitPageLabels = {
  exclusiveClothesGuide: string;
  exclusiveSpeciesClothes: string;
  description: string;
  selectSpecies: string;
  previewCredit: string;
};

export async function buildOutfitPageProps(species: string): Promise<OutfitPageLabels> {
  const t = await getTranslations();

  return {
    exclusiveClothesGuide: t('OutfitPage.exclusive-clothes-guide'),
    exclusiveSpeciesClothes: t('OutfitPage.exclusive-species-clothes', { species }),
    description: t('OutfitPage.description', { specie: species }),
    selectSpecies: t('PetColors.select-species'),
    previewCredit: 'Outfit previews powered by Dress to Impress',
  };
}

export function capitalizeSpecies(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getOutfitPagePathname(species: string) {
  return `/hub/outfits/${species.toLowerCase()}` as const;
}
