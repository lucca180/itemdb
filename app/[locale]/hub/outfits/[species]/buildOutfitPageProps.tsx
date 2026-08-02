import type { ReactNode } from 'react';
import { Link } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import { getTranslations } from 'next-intl/server';
import { petColorSlug } from '@utils/pet-utils';

export type OutfitPageLabels = {
  exclusiveClothesGuide: string;
  exclusiveSpeciesClothes: string;
  description: string;
  paintCta: ReactNode;
  allColoursOfSpecies: string;
  rainbowPoolHref: string;
  selectSpecies: string;
  previewCredit: string;
  showItems: string;
  hideItems: string;
};

export async function buildOutfitPageProps(species: string): Promise<OutfitPageLabels> {
  const t = await getTranslations();
  const rainbowPoolHref = `/tools/rainbow-pool/${petColorSlug(species)}`;

  return {
    exclusiveClothesGuide: t('OutfitPage.exclusive-clothes-guide'),
    exclusiveSpeciesClothes: t('OutfitPage.exclusive-species-clothes', { species }),
    description: t('OutfitPage.description', { specie: species }),
    paintCta: t.rich('OutfitPage.paint-cta', {
      species,
      RainbowPoolLink: (chunk) => (
        <Link asChild color="teal.200" fontWeight="semibold">
          <MainLink href={rainbowPoolHref} trackEvent="related-link" trackEventLabel="rainbow-pool">
            {chunk}
          </MainLink>
        </Link>
      ),
    }),
    allColoursOfSpecies: t('PetColors.all-colours-of', { 0: species }),
    rainbowPoolHref,
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
