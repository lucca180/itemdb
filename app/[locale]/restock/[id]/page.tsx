import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound, permanentRedirect } from 'next/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { doSearch } from '@pages/api/v1/search';
import { setRequestLocale } from 'next-intl/server';
import type { ItemData, SearchFilters, ShopInfo } from '@types';
import { getRestockProfit, removeOutliers, restockShopInfo } from '@utils/utils';
import { INITIAL_MIN_PROFIT, RESTOCK_FILTER } from '@utils/restock-filters';
import { mean } from 'simple-statistics';
import { buildRestockShopPageProps } from './buildRestockShopPageProps';
import { RestockShopPageContent } from './RestockShopPageContent';
import {
  getRestockShopPathname,
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';

type RestockShopPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockShopPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const labels = await buildRestockShopPageProps(shopInfo, {
    totalItems: 0,
    profitableCount: 0,
    profitMean: 0,
  });

  const pageProps = getStaticAppPageProps(locale, {
    title: `${shopInfo.name} | Neopets Shops`,
    description: labels.metaDescription,
    pathname: getRestockShopPathname(shopInfo),
  });

  return {
    ...pageProps.metadata,
    twitter: { ...pageProps.metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [
        {
          url: `https://images.neopets.com/shopkeepers/w${shopInfo.id}.gif`,
          width: 450,
          height: 150,
          alt: shopInfo.name,
        },
      ],
    },
  };
}

export default function RestockShopPage({ params }: RestockShopPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <RestockShopPageContentWrapper params={params} />
    </Suspense>
  );
}

async function RestockShopPageContentWrapper({ params }: RestockShopPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const route = resolveRestockShopRoute(id, locale);

  if (route.type === 'redirect') {
    permanentRedirect(route.destination);
  }
  if (route.type === 'notFound') {
    notFound();
  }

  const pageData = await loadRestockShopPageData(route.shop);
  const labels = await buildRestockShopPageProps(route.shop, {
    totalItems: pageData.totalItems,
    profitableCount: pageData.profitableCount,
    profitMean: pageData.profitMean,
  });

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={`${route.shop.color}a6`}>
      <RestockShopPageContent
        locale={locale}
        shopInfo={route.shop}
        similarShops={pageData.similarShops}
        initialItems={pageData.initialItems}
        labels={labels}
      />
    </AppServerLayout>
  );
}

type RestockShopPageData = {
  totalItems: number;
  profitableCount: number;
  profitMean: number;
  similarShops: ShopInfo[];
  initialItems: ItemData[];
};

async function loadRestockShopPageData(shopInfo: ShopInfo): Promise<RestockShopPageData> {
  'use cache';
  cacheTag(`restock-shop-${shopInfo.id}`);
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const filters: SearchFilters = RESTOCK_FILTER(shopInfo.id);
  filters.restockProfit = '';
  const result = await doSearch('', filters, false);

  const profitableItems = result.content
    .filter((item) => (getRestockProfit(item) ?? 0) >= INITIAL_MIN_PROFIT)
    .sort((a, b) => sortItemsByPriceDesc(a, b));

  const initialItems = profitableItems.slice(0, 32);

  return {
    totalItems: result.content.length,
    profitableCount: profitableItems.length,
    profitMean: computeProfitMean(profitableItems),
    similarShops: getSimilarShops(shopInfo),
    initialItems,
  };
}

function sortItemsByPriceDesc(a: ItemData, b: ItemData) {
  return (
    (b.price.value ?? Infinity) - (a.price.value ?? Infinity) ||
    (b.ncValue?.minValue ?? Infinity) - (a.ncValue?.minValue ?? Infinity)
  );
}

function computeProfitMean(items: ItemData[]) {
  const profits = items
    .map((item) => getRestockProfit(item, true))
    .filter((profit): profit is number => profit !== null);

  const cleanProfit = removeOutliers(profits, 1.75);
  if (!cleanProfit.length) return 0;
  return Math.round(mean(cleanProfit));
}

function getSimilarShops(shopInfo: ShopInfo, limit = 3) {
  return Object.values(restockShopInfo)
    .filter((shop) => shop.id !== shopInfo.id && shop.category === shopInfo.category)
    .slice(0, limit);
}
