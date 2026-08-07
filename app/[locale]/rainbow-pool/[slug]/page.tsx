import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import {
  loadCombosByColorSlug,
  loadCombosBySpeciesSlug,
  loadRainbowPoolCombo,
  resolveSlugKind,
} from '@app/server/rainbowPool';
import { allSpecies, petColorSlug } from '@utils/pet-utils';
import { withLocalePrefix, type AppLocale } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { BrowseContent } from '../components/BrowseContent';
import { browseColorTitle, browseSpeciesTitle, resolveBrowseName } from '@utils/petColorCopy';
import { BASE_PATH, MAIN_COLOR } from '../components/RainbowPoolShell';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations();

  const fallback = await getStaticAppMetadata({
    title: t('PetColors.pet-color-tool'),
    description: t('PetColors.cta'),
    pathname: BASE_PATH,
  });

  const kind = await resolveSlugKind(slug);
  if (!kind) return fallback;

  const colorsCatalog = await getAllNeopetsColors();
  const name = resolveBrowseName(slug, kind, colorsCatalog);
  const title = kind === 'species' ? browseSpeciesTitle(t, name) : browseColorTitle(t, name);
  const description =
    kind === 'species'
      ? t('PetColors.species-description', { 0: name })
      : t('PetColors.paint-description', { 0: name });

  return await getStaticAppMetadata({
    title,
    description,
    pathname: `${BASE_PATH}/${petColorSlug(name)}`,
  });
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

  const kind = await resolveSlugKind(slug);
  if (!kind) notFound();

  const colorsCatalog = await getAllNeopetsColors();
  const name = resolveBrowseName(slug, kind, colorsCatalog);
  const canonicalSlug = petColorSlug(name);

  if (slug !== canonicalSlug) {
    redirect(withLocalePrefix(`${BASE_PATH}/${canonicalSlug}`, locale as AppLocale));
  }

  const [combos, pathData] = await Promise.all([
    kind === 'species'
      ? loadCombosBySpeciesSlug(canonicalSlug)
      : loadCombosByColorSlug(canonicalSlug),
    kind === 'species'
      ? loadRainbowPoolCombo(undefined, canonicalSlug)
      : loadRainbowPoolCombo(canonicalSlug, undefined),
  ]);

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
        pathItems={
          kind === 'species' ? (pathData?.speciesChanges ?? []) : (pathData?.colorChanges ?? [])
        }
        chanceItems={pathData?.chanceChanges ?? []}
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
