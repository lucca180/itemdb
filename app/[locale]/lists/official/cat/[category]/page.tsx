import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing, withLocalePrefix, type AppLocale } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { listCategoriesData } from '@utils/lists/listCategoriesData';
import { loadOfficialListsCatData } from '../../loadOfficialLists';
import { OfficialListsCatPageClient } from './OfficialListsCatPageClient';

const ogImage = {
  url: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
  width: 150,
  height: 150,
};

type OfficialListsCatPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export async function generateMetadata({ params }: OfficialListsCatPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const catInfo = listCategoriesData[category];
  if (!catInfo) return {};

  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: `${catInfo.name} - ${t('General.official-lists')}`,
    description: t('Lists.officialList-description'),
    pathname: `/lists/official/cat/${category}`,
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [ogImage],
    },
  };
}

export default async function OfficialListsCatPage({ params }: OfficialListsCatPageProps) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!listCategoriesData[category]) {
    redirect(withLocalePrefix('/lists/official?cat=' + category, locale as AppLocale));
  }

  const data = await loadOfficialListsCatData(category);
  if (!data) {
    redirect(withLocalePrefix('/lists/official?cat=' + category, locale as AppLocale));
  }

  const mainColor = data.catInfo.color + 'c7';

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <OfficialListsCatPageClient lists={data.lists} locale={locale} selectedCategory={category} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  const categories = Object.keys(listCategoriesData);
  return routing.locales.flatMap((locale) => categories.map((category) => ({ locale, category })));
}
