import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getAllNeopetsColors } from '@app/server/petColors';
import { loadPetStylesComboDetail } from '@app/server/petStyles';
import { allSpecies, findPetColorId, getSpeciesId, petColorSlug } from '@utils/pet-utils';
import { resolveBrowseName } from '@utils/petColorCopy';
import {
  STYLES_BASE_PATH,
  UNKNOWN_COLOR_NAME,
  UNKNOWN_COLOR_SLUG,
  isUnknownColorSlug,
  stylesComboHref,
  withUnknownColorOption,
} from '@utils/petStyles/paths';
import { withLocalePrefix, type AppLocale, routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MAIN_COLOR } from '../../../components/RainbowPoolShell';
import { StylesComboContent } from '../../components/StylesComboContent';

type PageProps = {
  params: Promise<{ locale: string; slug: string; color: string }>;
};

function resolveCombo(
  speciesSlug: string,
  colorSlug: string,
  colorsCatalog: Record<string, string>
) {
  const speciesId = getSpeciesId(speciesSlug);
  if (!speciesId) return null;

  const speciesName = resolveBrowseName(speciesSlug, 'species', colorsCatalog);

  if (isUnknownColorSlug(colorSlug)) {
    return {
      speciesId,
      colorId: null as number | null,
      speciesName,
      colorName: UNKNOWN_COLOR_NAME,
      isUnknown: true,
    };
  }

  const colorId = findPetColorId(colorSlug, colorsCatalog);
  if (!colorId) return null;

  return {
    speciesId,
    colorId,
    speciesName,
    colorName: resolveBrowseName(colorSlug, 'color', colorsCatalog),
    isUnknown: false,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, color } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const colorsCatalog = await getAllNeopetsColors();
  const combo = resolveCombo(slug, color, colorsCatalog);
  if (!combo) {
    return getStaticAppPageProps(locale, {
      title: t('PetStyles.hub-seo-title'),
      description: t('PetStyles.hub-seo-description'),
      pathname: STYLES_BASE_PATH,
      noindex: true,
    }).metadata;
  }

  const tokens = await loadPetStylesComboDetail(combo.speciesId, combo.colorId, combo.colorName);

  const pageProps = getStaticAppPageProps(locale, {
    title: combo.isUnknown
      ? t('PetStyles.combo-seo-title-unknown', { species: combo.speciesName })
      : t('PetStyles.combo-seo-title', {
          color: combo.colorName,
          species: combo.speciesName,
        }),
    description: combo.isUnknown
      ? t('PetStyles.combo-seo-description-unknown', { species: combo.speciesName })
      : t('PetStyles.combo-seo-description', {
          color: combo.colorName,
          species: combo.speciesName,
        }),
    pathname: stylesComboHref(combo.speciesName, combo.colorName),
    noindex: tokens.length === 0,
  });
  return pageProps.metadata;
}

export default function PetStylesComboPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={MAIN_COLOR} />}>
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: PageProps) {
  const { locale, slug, color } = await params;
  setRequestLocale(locale);

  const colorsCatalog = await getAllNeopetsColors();
  const combo = resolveCombo(slug, color, colorsCatalog);
  if (!combo) notFound();

  const canonicalSpecies = petColorSlug(combo.speciesName);
  const canonicalColor = combo.isUnknown ? UNKNOWN_COLOR_SLUG : petColorSlug(combo.colorName);

  if (slug !== canonicalSpecies || color !== canonicalColor) {
    redirect(
      withLocalePrefix(
        `${STYLES_BASE_PATH}/${canonicalSpecies}/${canonicalColor}`,
        locale as AppLocale
      )
    );
  }

  const [tokens, colors, species] = await Promise.all([
    loadPetStylesComboDetail(combo.speciesId, combo.colorId, combo.colorName),
    Promise.resolve(
      withUnknownColorOption(Object.values(colorsCatalog).sort((a, b) => a.localeCompare(b)))
    ),
    Promise.resolve(Object.values(allSpecies).sort((a, b) => a.localeCompare(b))),
  ]);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={MAIN_COLOR}>
      <StylesComboContent
        locale={locale}
        speciesName={combo.speciesName}
        colorName={combo.colorName}
        colors={colors}
        species={species}
        tokens={tokens}
        isUnknownColor={combo.isUnknown}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    [
      { slug: 'aisha', color: 'faerie' },
      { slug: 'acara', color: 'faerie' },
      { slug: 'acara', color: 'unknown' },
    ].map((path) => ({ locale, ...path }))
  );
}
