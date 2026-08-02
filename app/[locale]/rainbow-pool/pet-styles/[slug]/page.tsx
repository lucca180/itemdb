import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import { resolveSlugKind } from '@app/server/rainbowPool';
import {
  loadPetStyleSeriesCatalog,
  loadPetStylesBrowseByColor,
  loadPetStylesBrowseBySpecies,
  resolvePetStyleSeriesSlug,
} from '@app/server/petStyles';
import { allSpecies, findPetColorId, getSpeciesId, petColorSlug } from '@utils/pet-utils';
import { resolveBrowseName } from '@utils/petColorCopy';
import {
  STYLES_BASE_PATH,
  UNKNOWN_COLOR_NAME,
  UNKNOWN_COLOR_SLUG,
  isUnknownColorSlug,
  parseStylesPage,
  stylesBrowseHref,
  withUnknownColorOption,
} from '@utils/petStyles/paths';
import { withLocalePrefix, type AppLocale, routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MAIN_COLOR } from '../../components/RainbowPoolShell';
import { PetStylesBrowseContent } from '../components/PetStylesBrowseContent';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    series?: string;
    prismatic?: string;
    available?: string;
    page?: string;
  }>;
};

async function resolveBrowseSlug(slug: string): Promise<{
  mode: 'species' | 'color';
  name: string;
  colorId: number | null;
  speciesId: number | null;
} | null> {
  if (isUnknownColorSlug(slug)) {
    return {
      mode: 'color',
      name: UNKNOWN_COLOR_NAME,
      colorId: null,
      speciesId: null,
    };
  }

  const kind = await resolveSlugKind(slug);
  if (!kind) return null;

  const colorsCatalog = await getAllNeopetsColors();
  const name = resolveBrowseName(slug, kind, colorsCatalog);

  if (kind === 'species') {
    return {
      mode: 'species',
      name,
      colorId: null,
      speciesId: getSpeciesId(slug),
    };
  }

  return {
    mode: 'color',
    name,
    colorId: findPetColorId(slug, colorsCatalog),
    speciesId: null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const resolved = await resolveBrowseSlug(slug);
  if (!resolved) {
    return getStaticAppPageProps(locale, {
      title: t('PetStyles.hub-seo-title'),
      description: t('PetStyles.hub-seo-description'),
      pathname: STYLES_BASE_PATH,
      noindex: true,
    }).metadata;
  }

  const browse =
    resolved.mode === 'species'
      ? await loadPetStylesBrowseBySpecies(resolved.speciesId!)
      : await loadPetStylesBrowseByColor(resolved.colorId, resolved.name);
  const tokenCount = browse?.tokens.length ?? 0;
  const isUnknown = resolved.name === UNKNOWN_COLOR_NAME;

  const pageProps = getStaticAppPageProps(locale, {
    title: isUnknown
      ? t('PetStyles.browse-seo-title-unknown')
      : t('PetStyles.browse-seo-title', { name: resolved.name }),
    description: isUnknown
      ? t('PetStyles.browse-seo-description-unknown')
      : t('PetStyles.browse-seo-description', { name: resolved.name }),
    pathname: stylesBrowseHref(resolved.name),
    noindex: tokenCount === 0,
  });
  return pageProps.metadata;
}

export default function PetStylesBrowsePage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={MAIN_COLOR} />}>
      <PageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PageContent({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const resolved = await resolveBrowseSlug(slug);
  if (!resolved) notFound();

  const canonicalSlug = isUnknownColorSlug(resolved.name)
    ? UNKNOWN_COLOR_SLUG
    : petColorSlug(resolved.name);
  if (slug !== canonicalSlug) {
    const keep = new URLSearchParams();
    if (query.series) keep.set('series', query.series);
    if (query.prismatic === '1') keep.set('prismatic', '1');
    if (query.available === '1') keep.set('available', '1');
    if (query.page && query.page !== '1') keep.set('page', query.page);
    const qs = keep.toString();
    redirect(
      withLocalePrefix(
        `${STYLES_BASE_PATH}/${canonicalSlug}${qs ? `?${qs}` : ''}`,
        locale as AppLocale
      )
    );
  }

  const prismatic = query.prismatic === '1';
  const availableNow = query.available === '1';
  const page = parseStylesPage(query.page);
  const seriesName = (await resolvePetStyleSeriesSlug(query.series)) ?? '';
  const filters = {
    series: seriesName || null,
    prismaticOnly: prismatic,
    availableNowOnly: availableNow,
    page,
  };

  const [browse, colorsCatalog, seriesOptions] = await Promise.all([
    resolved.mode === 'species'
      ? loadPetStylesBrowseBySpecies(resolved.speciesId!, filters)
      : loadPetStylesBrowseByColor(resolved.colorId, resolved.name, filters),
    getAllNeopetsColors(),
    loadPetStyleSeriesCatalog(),
  ]);

  if (!browse) notFound();

  const colors = withUnknownColorOption(
    Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b))
  );
  const species = Object.values(allSpecies).sort((a, b) => a.localeCompare(b));

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={MAIN_COLOR}>
      <PetStylesBrowseContent
        locale={locale}
        mode={resolved.mode}
        name={resolved.name}
        colors={colors}
        species={species}
        seriesOptions={seriesOptions}
        tokens={browse.tokens}
        total={browse.total}
        page={browse.page}
        pageSize={browse.pageSize}
        combos={browse.combos}
        seriesName={seriesName}
        prismatic={prismatic}
        availableNow={availableNow}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    [{ slug: 'aisha' }, { slug: 'faerie' }, { slug: 'unknown' }].map((path) => ({
      locale,
      ...path,
    }))
  );
}
