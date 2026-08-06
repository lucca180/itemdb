import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import {
  loadCombosByColorSlug,
  loadCombosBySpeciesSlug,
  resolveSlugKind,
} from '@app/server/rainbowPool';
import { allSpecies, petColorSlug } from '@utils/pet-utils';
import { withLocalePrefix, type AppLocale } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrowseContent } from '../components/BrowseContent';
import { browseColorTitle, browseSpeciesTitle, resolveBrowseName } from '@utils/petColorCopy';
import { BASE_PATH, MAIN_COLOR } from '../components/RainbowPoolShell';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const fallback = getStaticAppPageProps(locale, {
    title: t('PetColors.pet-color-tool'),
    description: t('PetColors.cta'),
    pathname: BASE_PATH,
  }).metadata;

  const kind = await resolveSlugKind(slug);
  if (!kind) return fallback;

  const colorsCatalog = await getAllNeopetsColors();
  const name = resolveBrowseName(slug, kind, colorsCatalog);
  const title = kind === 'species' ? browseSpeciesTitle(t, name) : browseColorTitle(t, name);
  const description =
    kind === 'species'
      ? t('PetColors.species-description', { 0: name })
      : t('PetColors.paint-description', { 0: name });

  return getStaticAppPageProps(locale, {
    title,
    description,
    pathname: `${BASE_PATH}/${petColorSlug(name)}`,
  }).metadata;
}

export default function RainbowPoolBrowsePage({ params }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const kind = await resolveSlugKind(slug);
  if (!kind) notFound();

  const colorsCatalog = await getAllNeopetsColors();
  const name = resolveBrowseName(slug, kind, colorsCatalog);
  const canonicalSlug = petColorSlug(name);

  if (slug !== canonicalSlug) {
    redirect(withLocalePrefix(`${BASE_PATH}/${canonicalSlug}`, locale as AppLocale));
  }

  const combos =
    kind === 'species'
      ? await loadCombosBySpeciesSlug(canonicalSlug)
      : await loadCombosByColorSlug(canonicalSlug);

  if (!combos) notFound();

  const colors = Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b));
  const species = Object.values(allSpecies).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <SetMainColor color={MAIN_COLOR} />
      <BrowseContent
        locale={locale}
        mode={kind}
        name={name}
        combos={combos}
        colors={colors}
        species={species}
      />
    </>
  );
}

export function generateStaticParams() {
  return ['en', 'pt'].flatMap((locale) =>
    [{ slug: 'acara' }, { slug: 'faerie' }].map((path) => ({ locale, ...path }))
  );
}
