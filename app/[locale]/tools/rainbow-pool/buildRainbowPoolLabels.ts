import { getTranslations } from 'next-intl/server';

export type RainbowPoolLabels = {
  toolTitle: string;
  cta: string;
  eyebrowLabel: string;
  selectColorLabel: string;
  selectSpeciesLabel: string;
  searchLabel: string;
  copyLinkLabel: string;
  linkCopiedTitle: string;
  poweredByLabel: string;
  recentlyReleasedTitle: string;
  popularColorsTitle: string;
  howItWorksTitle: string;
  howItWorksSteps: string[];
  perfectMatchLabel: string;
  cheapestWayLabel: string;
  cheapestPathLabel: string;
  colorChangeLabel: string;
  speciesChangeLabel: string;
  noColor1: string;
  noColor2: string;
};

export async function buildRainbowPoolLabels(): Promise<RainbowPoolLabels> {
  const t = await getTranslations();

  return {
    toolTitle: t('PetColors.hub-h1'),
    cta: t('PetColors.hub-lede'),
    eyebrowLabel: t('Layout.tools'),
    selectColorLabel: t('PetColors.select-color'),
    selectSpeciesLabel: t('PetColors.select-species'),
    searchLabel: t('Search.search'),
    copyLinkLabel: t('Layout.copy-link'),
    linkCopiedTitle: t('General.link-copied'),
    poweredByLabel: t('ItemPage.powered-by'),
    recentlyReleasedTitle: t('PetColors.recently-released'),
    popularColorsTitle: t('PetColors.popular-colors'),
    howItWorksTitle: t('PetColors.how-it-works'),
    howItWorksSteps: [
      t('PetColors.how-it-works-step-1'),
      t('PetColors.how-it-works-step-2'),
      t('PetColors.how-it-works-step-3'),
    ],
    perfectMatchLabel: t('PetColors.perfect-match'),
    cheapestWayLabel: t('PetColors.cheapest-way'),
    cheapestPathLabel: t('PetColors.cheapest-path'),
    colorChangeLabel: t('PetColors.color-change'),
    speciesChangeLabel: t('PetColors.species-change'),
    noColor1: t('PetColors.no-color-1'),
    noColor2: t('PetColors.no-color-2'),
  };
}
