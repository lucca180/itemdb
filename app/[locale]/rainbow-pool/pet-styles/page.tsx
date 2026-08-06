import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import {
  loadPetStyleSeriesCatalog,
  loadRecentPetStyleCombos,
  loadRecentlyReleasedPetStyles,
  loadStudioEssentialItems,
  resolvePetStyleSeriesSlug,
  searchPetStylesHub,
} from '@app/server/petStyles';
import { allSpecies } from '@utils/pet-utils';
import { STYLES_BASE_PATH, parseStylesPage, withUnknownColorOption } from '@utils/petStyles/paths';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MAIN_COLOR } from '../components/RainbowPoolShell';
import { PetStylesHubContent } from './components/PetStylesHubContent';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    series?: string;
    prismatic?: string;
    available?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // Canonical stays clean even when filter / page query params are present.
  const pageProps = getStaticAppPageProps(locale, {
    title: t('PetStyles.hub-seo-title'),
    description: t('PetStyles.hub-seo-description'),
    pathname: STYLES_BASE_PATH,
  });
  return pageProps.metadata;
}

export default function PetStylesHubPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PageContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const prismatic = query.prismatic === '1';
  const availableNow = query.available === '1';
  const seriesName = (await resolvePetStyleSeriesSlug(query.series)) ?? '';
  const hasActiveFilter = Boolean(seriesName || prismatic || availableNow);
  const page = hasActiveFilter ? parseStylesPage(query.page) : 1;

  const [colorsCatalog, seriesOptions, tokenPage, recentCombos, studioItems] = await Promise.all([
    getAllNeopetsColors(),
    loadPetStyleSeriesCatalog(),
    hasActiveFilter
      ? searchPetStylesHub({
          series: seriesName || null,
          prismaticOnly: prismatic,
          availableNowOnly: availableNow,
          page,
        })
      : loadRecentlyReleasedPetStyles(12).then((tokens) => ({
          tokens,
          // No pagination on the default “recently released” strip.
          total: tokens.length,
          page: 1,
          pageSize: tokens.length || 1,
        })),
    hasActiveFilter ? Promise.resolve([]) : loadRecentPetStyleCombos(8),
    loadStudioEssentialItems(),
  ]);

  const colors = withUnknownColorOption(
    Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b))
  );
  const species = Object.values(allSpecies).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <SetMainColor color={MAIN_COLOR} />
      <PetStylesHubContent
        locale={locale}
        colors={colors}
        species={species}
        seriesOptions={seriesOptions}
        tokens={tokenPage.tokens}
        total={tokenPage.total}
        page={tokenPage.page}
        pageSize={tokenPage.pageSize}
        recentCombos={recentCombos}
        studioItems={studioItems}
        seriesName={seriesName}
        prismatic={prismatic}
        availableNow={availableNow}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
