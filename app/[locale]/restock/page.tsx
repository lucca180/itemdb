import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTrendingShops } from '@pages/api/v1/beta/trending';
import type { ShopInfo } from '@types';
import { buildRestockPageMetadata, buildRestockPageProps } from './buildRestockPageProps';
import { RestockPageContent } from './RestockPageContent';

const mainColor = 'rgba(165, 218, 233, 0.4)';

type RestockPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await buildRestockPageMetadata();
  const metadata = await getStaticAppMetadata({
    title,
    description,
    pathname: '/restock',
  });

  return {
    ...metadata,
  };
}

export default function RestockPage({ params }: RestockPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <RestockPageContentWrapper params={params} />
    </Suspense>
  );
}

async function RestockPageContentWrapper({ params }: RestockPageProps) {
  const { locale } = await params;
  const [labels, trendingShops] = await Promise.all([buildRestockPageProps(), loadTrendingShops()]);

  return (
    <>
      <SetMainColor color={mainColor} />
      <RestockPageContent locale={locale} labels={labels} trendingShops={trendingShops} />
    </>
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
