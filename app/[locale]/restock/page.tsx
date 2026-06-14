import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTrendingShops } from '@pages/api/v1/beta/trending';
import { setRequestLocale } from 'next-intl/server';
import type { ShopInfo } from '@types';
import { buildRestockPageMetadata, buildRestockPageProps } from './buildRestockPageProps';
import { RestockPageContent } from './RestockPageContent';

const mainColor = 'rgba(165, 218, 233, 0.4)';
const themeColor = '#A5DAE9';

type RestockPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RestockPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { title, description } = await buildRestockPageMetadata();
  const pageProps = getStaticAppPageProps(locale, {
    title,
    description,
    pathname: '/restock',
  });

  return {
    ...pageProps.metadata,
    themeColor,
  };
}

export default function RestockPage({ params }: RestockPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <RestockPageContentWrapper params={params} />
    </Suspense>
  );
}

async function RestockPageContentWrapper({ params }: RestockPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [labels, trendingShops] = await Promise.all([buildRestockPageProps(), loadTrendingShops()]);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <RestockPageContent locale={locale} labels={labels} trendingShops={trendingShops} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadTrendingShops(): Promise<ShopInfo[]> {
  'use cache';
  cacheTag('restock-index');
  cacheLife({ stale: 86400, revalidate: 86400, expire: 172800 });

  return getTrendingShops(4).catch(() => []);
}
