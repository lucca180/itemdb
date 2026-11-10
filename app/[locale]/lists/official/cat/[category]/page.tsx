import { permanentRedirect, redirect } from 'next/navigation';
import { routing, withLocalePrefix, type AppLocale } from '@utils/locales';
import {
  getOfficialCategory,
  officialCategorySlugs,
} from '@app/[locale]/lists/official/_categories';

type LegacyOfficialCatPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

/** Legacy `/lists/official/cat/<slug>` → `/lists/official/<slug>`. */
export default async function LegacyOfficialCatPage({ params }: LegacyOfficialCatPageProps) {
  const { locale, category } = await params;
  const config = getOfficialCategory(category);

  if (!config) {
    redirect(withLocalePrefix('/lists/official?cat=' + category, locale as AppLocale));
  }

  permanentRedirect(withLocalePrefix(`/lists/official/${config.slug}`, locale as AppLocale));
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    officialCategorySlugs.map((category) => ({ locale, category }))
  );
}
