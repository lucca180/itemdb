import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { getSpeciesOutfits } from '@pages/api/v1/tools/outfits';

import type { ItemData } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { routing } from '@utils/locales';
import { OutfitPageContent } from './OutfitPageContent';
import {
  buildOutfitPageProps,
  getOutfitPagePathname,
  resolveSpecies,
} from './buildOutfitPageProps';

// params are awaited outside Suspense (real 404 status), so the route can't have a static shell
export const instant = false;

const mainColor = '#94aefaca';
const headerImage = 'https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png';

type OutfitPageProps = {
  params: Promise<{ locale: string; species: string }>;
};

export async function generateMetadata({ params }: OutfitPageProps): Promise<Metadata> {
  const { species: speciesSlug } = await params;
  const species = resolveSpecies(speciesSlug);
  if (!species) notFound();

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

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    [{ species: 'aisha' }, { species: 'kougra' }].map((path) => ({ locale, ...path }))
  );
}

export default async function OutfitPage({ params }: OutfitPageProps) {
  // Validated before the Suspense boundary so invalid species return a real 404 status
  const { species } = await params;
  if (!resolveSpecies(species)) notFound();

  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <OutfitPageContentWrapper params={params} />
    </Suspense>
  );
}

async function OutfitPageContentWrapper({ params }: OutfitPageProps) {
  const { species: speciesSlug } = await params;
  const species = resolveSpecies(speciesSlug);
  if (!species) notFound();

  const [labels, outfits] = await Promise.all([
    buildOutfitPageProps(species),
    loadSpeciesOutfits(species),
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
