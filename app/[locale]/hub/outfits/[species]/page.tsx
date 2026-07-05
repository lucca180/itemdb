import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getSpeciesOutfits } from '@pages/api/v1/tools/outfits';
import { setRequestLocale } from 'next-intl/server';
import type { ItemData } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { OutfitPageContent } from './OutfitPageContent';
import {
  buildOutfitPageProps,
  capitalizeSpecies,
  getOutfitPagePathname,
} from './buildOutfitPageProps';

const mainColor = '#94aefaca';
const headerImage = 'https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png';

type OutfitPageProps = {
  params: Promise<{ locale: string; species: string }>;
};

export async function generateMetadata({ params }: OutfitPageProps): Promise<Metadata> {
  const { locale, species: speciesSlug } = await params;
  setRequestLocale(locale);
  const species = capitalizeSpecies(speciesSlug);
  const labels = await buildOutfitPageProps(species);
  const pageProps = getStaticAppPageProps(locale, {
    title: labels.exclusiveSpeciesClothes,
    description: labels.description,
    pathname: getOutfitPagePathname(speciesSlug),
  });

  return {
    ...pageProps.metadata,
    twitter: { ...pageProps.metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [{ url: headerImage, width: 600, height: 200, alt: labels.exclusiveClothesGuide }],
    },
  };
}

export default function OutfitPage({ params }: OutfitPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <OutfitPageContentWrapper params={params} />
    </Suspense>
  );
}

async function OutfitPageContentWrapper({ params }: OutfitPageProps) {
  const { locale, species: speciesSlug } = await params;
  setRequestLocale(locale);
  const species = capitalizeSpecies(speciesSlug);
  const [labels, outfits] = await Promise.all([
    buildOutfitPageProps(species),
    loadSpeciesOutfits(speciesSlug),
  ]);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <OutfitPageContent outfits={outfits} species={species} labels={labels} />
    </AppServerLayout>
  );
}

async function loadSpeciesOutfits(speciesSlug: string): Promise<Record<string, ItemData[]>> {
  'use cache';
  cacheTag(fitCacheTag(`outfits-${speciesSlug.toLowerCase()}`));
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  return getSpeciesOutfits(speciesSlug);
}
