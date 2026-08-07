import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { getSpeciesOutfits } from '@pages/api/v1/tools/outfits';

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
  const { species: speciesSlug } = await params;
  const species = capitalizeSpecies(speciesSlug);
  const labels = await buildOutfitPageProps(species);
  const metadata = await getStaticAppMetadata({
    title: labels.exclusiveSpeciesClothes,
    description: labels.description,
    pathname: getOutfitPagePathname(speciesSlug),
  });

  return {
    ...metadata,
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: headerImage, width: 600, height: 200, alt: labels.exclusiveClothesGuide }],
    },
  };
}

export default function OutfitPage({ params }: OutfitPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <OutfitPageContentWrapper params={params} />
    </Suspense>
  );
}

async function OutfitPageContentWrapper({ params }: OutfitPageProps) {
  const { species: speciesSlug } = await params;
  const species = capitalizeSpecies(speciesSlug);
  const [labels, outfits] = await Promise.all([
    buildOutfitPageProps(species),
    loadSpeciesOutfits(speciesSlug),
  ]);

  return (
    <>
      <SetMainColor color={mainColor} />
      <OutfitPageContent outfits={outfits} species={species} labels={labels} />
    </>
  );
}

async function loadSpeciesOutfits(speciesSlug: string): Promise<Record<string, ItemData[]>> {
  'use cache';
  cacheTag(fitCacheTag(`outfits-${speciesSlug.toLowerCase()}`));
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  return getSpeciesOutfits(speciesSlug);
}
