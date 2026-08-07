import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import { loadRecentlyReleasedCombos } from '@app/server/rainbowPool';
import { allSpecies } from '@utils/pet-utils';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { HubContent } from './components/HubContent';
import { BASE_PATH, MAIN_COLOR } from './components/RainbowPoolShell';

const ogImage = {
  url: 'https://itemdb.com.br/pet-color-hub.png',
  width: 600,
  height: 200,
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('PetColors.hub-seo-title'),
    description: t('PetColors.hub-seo-description'),
    pathname: BASE_PATH,
  });

  return {
    ...metadata,
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
      images: [{ ...ogImage, alt: t('PetColors.hub-h1') }],
    },
  };
}

export default function RainbowPoolHubPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: PageProps) {
  const { locale } = await params;

  const [colorsCatalog, recentlyReleased] = await Promise.all([
    getAllNeopetsColors(),
    loadRecentlyReleasedCombos(16),
  ]);

  const colors = Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b));
  const species = Object.values(allSpecies).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <SetMainColor color={MAIN_COLOR} />
      <HubContent
        locale={locale}
        colors={colors}
        species={species}
        recentlyReleased={recentlyReleased}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
