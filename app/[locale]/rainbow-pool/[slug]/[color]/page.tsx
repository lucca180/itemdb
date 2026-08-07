import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import { loadComboPbOutfit, loadRainbowPoolCombo, loadSpeciesInfo } from '@app/server/rainbowPool';
import { loadComboPetStyles } from '@app/server/petStyles';
import { allSpecies, findPetColorId, getSpeciesId, petColorSlug } from '@utils/pet-utils';
import { withLocalePrefix, type AppLocale } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { ComboContent } from '../../components/ComboContent';
import { MissingComboContent } from '../../components/MissingComboContent';
import { howToGetComboSeoTitle, resolveBrowseName } from '@utils/petColorCopy';
import { BASE_PATH, MAIN_COLOR } from '../../components/RainbowPoolShell';

type PageProps = {
  params: Promise<{ locale: string; slug: string; color: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: speciesSlug, color: colorSlug } = await params;
  const t = await getTranslations();

  const fallback = await getStaticAppMetadata({
    title: t('PetColors.pet-color-tool'),
    description: t('PetColors.cta'),
    pathname: BASE_PATH,
  });

  const petColorData = await loadRainbowPoolCombo(colorSlug, speciesSlug);
  if (!petColorData?.speciesName || !petColorData?.colorName) {
    const colorsCatalog = await getAllNeopetsColors();
    const speciesOk = Boolean(getSpeciesId(speciesSlug));
    const colorOk = Boolean(findPetColorId(colorSlug, colorsCatalog));

    if (speciesOk && colorOk) {
      const speciesName = resolveBrowseName(speciesSlug, 'species', colorsCatalog);
      const colorName = resolveBrowseName(colorSlug, 'color', colorsCatalog);
      return await getStaticAppMetadata({
        title: t('PetColors.combination-error'),
        description: t('PetColors.combination-error-desc', { 0: colorName, 1: speciesName }),
        pathname: `${BASE_PATH}/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
        noindex: true,
      });
    }

    return fallback;
  }

  const { speciesName, colorName, thumbnail, speciesId, colorId } = petColorData;
  const previewUrl = `https://cdn.itemdb.com.br/colors/${thumbnail.species}_${thumbnail.color}.png`;
  const styleGroups = await loadComboPetStyles(speciesId, colorId, colorName);
  const description = styleGroups.length
    ? t('PetColors.species-color-description-with-styles', { 0: colorName, 1: speciesName })
    : t('PetColors.species-color-description', { 0: colorName, 1: speciesName });

  const metadata = await getStaticAppMetadata({
    title: howToGetComboSeoTitle(t, colorName, speciesName),
    description,
    pathname: `${BASE_PATH}/${petColorSlug(speciesName)}/${petColorSlug(colorName)}`,
  });

  return {
    ...metadata,
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: previewUrl, width: 150, height: 150, alt: `${colorName} ${speciesName}` }],
    },
  };
}

export default function RainbowPoolComboPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: PageProps) {
  const { locale, slug: speciesSlug, color: colorSlug } = await params;

  const colorsCatalog = await getAllNeopetsColors();
  const colors = Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b));
  const species = Object.values(allSpecies).sort((a, b) => a.localeCompare(b));

  const petColorData = await loadRainbowPoolCombo(colorSlug, speciesSlug);

  if (!petColorData?.speciesName || !petColorData?.colorName) {
    const speciesOk = Boolean(getSpeciesId(speciesSlug));
    const colorOk = Boolean(findPetColorId(colorSlug, colorsCatalog));

    if (speciesOk && colorOk) {
      const speciesName = resolveBrowseName(speciesSlug, 'species', colorsCatalog);
      const colorName = resolveBrowseName(colorSlug, 'color', colorsCatalog);

      return (
        <>
          <SetMainColor color={MAIN_COLOR} />
          <MissingComboContent
            locale={locale}
            colorName={colorName}
            speciesName={speciesName}
            colors={colors}
            species={species}
          />
        </>
      );
    }

    if (speciesOk) {
      redirect(withLocalePrefix(`${BASE_PATH}/${petColorSlug(speciesSlug)}`, locale as AppLocale));
    }

    if (colorOk) {
      redirect(withLocalePrefix(`${BASE_PATH}/${petColorSlug(colorSlug)}`, locale as AppLocale));
    }

    notFound();
  }

  if (
    petColorSlug(petColorData.speciesName) !== petColorSlug(speciesSlug) ||
    petColorSlug(petColorData.colorName) !== petColorSlug(colorSlug)
  ) {
    redirect(
      withLocalePrefix(
        `${BASE_PATH}/${petColorSlug(petColorData.speciesName)}/${petColorSlug(petColorData.colorName)}`,
        locale as AppLocale
      )
    );
  }

  const [speciesInfo, pbOutfit, petStyleGroups] = await Promise.all([
    loadSpeciesInfo(petColorData.speciesName),
    loadComboPbOutfit(petColorData.colorName, petColorData.speciesName),
    loadComboPetStyles(petColorData.speciesId, petColorData.colorId, petColorData.colorName),
  ]);

  return (
    <>
      <SetMainColor color={MAIN_COLOR} />
      <ComboContent
        locale={locale}
        petColorData={petColorData}
        speciesInfo={speciesInfo}
        pbOutfit={pbOutfit}
        petStyleGroups={petStyleGroups}
        colors={colors}
        species={species}
      />
    </>
  );
}

export function generateStaticParams() {
  return ['en', 'pt'].flatMap((locale) => [{ locale, slug: 'acara', color: 'faerie' }]);
}
