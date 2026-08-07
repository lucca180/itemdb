import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';

import { buildRestockShopPageProps } from './buildRestockShopPageProps';
import { RestockShopPageContent } from './RestockShopPageContent';
import { getRestockShopData, RESTOCK_PRELOAD_LIMIT } from './loadRestockShop';
import {
  getRestockShopPathname,
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';

type RestockShopPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockShopPageProps): Promise<Metadata> {
  const { id } = await params;
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const labels = await buildRestockShopPageProps(shopInfo, {
    totalItems: 0,
    profitableCount: 0,
    profitMean: 0,
  });

  const metadata = await getStaticAppMetadata({
    title: `${shopInfo.name} | Neopets Shops`,
    description: labels.metaDescription,
    pathname: getRestockShopPathname(shopInfo),
  });

  return {
    ...metadata,
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
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
  const route = resolveRestockShopRoute(id, locale);

  if (route.type === 'redirect') {
    permanentRedirect(route.destination);
  }
  if (route.type === 'notFound') {
    notFound();
  }

  const pageData = await getRestockShopData(route.shop);
  const labels = await buildRestockShopPageProps(route.shop, {
    totalItems: pageData.totalItems,
    profitableCount: pageData.profitableCount,
    profitMean: pageData.profitMean,
  });

  const initialItems = pageData.fullItems.slice(0, RESTOCK_PRELOAD_LIMIT);
  const needsFullLoad = pageData.profitableCount > initialItems.length;

  return (
    <>
      <SetMainColor color={`${route.shop.color}a6`} />
      <RestockShopPageContent
        locale={locale}
        routeId={id}
        shopInfo={route.shop}
        similarShops={pageData.similarShops}
        initialItems={initialItems}
        needsFullLoad={needsFullLoad}
        labels={labels}
      />
    </>
  );
}
