import { getTranslations } from 'next-intl/server';
import { petColorSlug } from '@utils/pet-utils';
import { stylesBrowseHref } from '@utils/petStyles/paths';

export type OutfitPageLabels = {
  exclusiveClothesGuide: string;
  exclusiveSpeciesClothes: string;
  description: string;
  allColoursOfSpecies: string;
  allStylesOfSpecies: string;
  rainbowPoolHref: string;
  petStylesHref: string;
  rainbowPoolCardTitle: string;
  petStylesCardTitle: string;
  exploreLinksCta: string;
  selectSpecies: string;
  previewCredit: string;
  showItems: string;
  hideItems: string;
};

export async function buildOutfitPageProps(species: string): Promise<OutfitPageLabels> {
  const t = await getTranslations();
  const rainbowPoolHref = `/rainbow-pool/${petColorSlug(species)}`;
  const petStylesHref = stylesBrowseHref(species);

  return {
    exclusiveClothesGuide: t('OutfitPage.exclusive-clothes-guide'),
    exclusiveSpeciesClothes: t('OutfitPage.exclusive-species-clothes', { species }),
    description: t('OutfitPage.description', { specie: species }),
    allColoursOfSpecies: t('PetColors.all-colours-of', { 0: species }),
    allStylesOfSpecies: t('PetStyles.all-species-styles', { species }),
    rainbowPoolHref,
    petStylesHref,
    rainbowPoolCardTitle: t('HomePage.rainbow-pool'),
    petStylesCardTitle: t('PetStyles.hub-h1'),
    exploreLinksCta: t('OutfitPage.explore-links-cta', { species }),
    selectSpecies: t('PetColors.select-species'),
    previewCredit: 'Outfit previews powered by Dress to Impress',
    showItems: t('OutfitPage.show-items'),
    hideItems: t('OutfitPage.hide-items'),
  };
}

export function capitalizeSpecies(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getOutfitPagePathname(species: string) {
  return `/hub/outfits/${species.toLowerCase()}` as const;
}
