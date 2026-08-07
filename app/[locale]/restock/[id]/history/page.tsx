import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import {
  getRestockShopPathname,
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';

import {
  buildRestockHistoryPageMetadata,
  buildRestockHistoryPageProps,
} from './buildRestockHistoryPageProps';
import { RestockHistoryPageContent } from './RestockHistoryPageContent';

type RestockHistoryPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockHistoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const { title, description } = await buildRestockHistoryPageMetadata(shopInfo);

  const metadata = await getStaticAppMetadata({
    title,
    description,
    pathname: getRestockShopPathname(shopInfo, true),
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

export default function RestockHistoryPage({ params }: RestockHistoryPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <RestockHistoryPageContentWrapper params={params} />
    </Suspense>
  );
}

async function RestockHistoryPageContentWrapper({ params }: RestockHistoryPageProps) {
  const { locale, id } = await params;
  const route = resolveRestockShopRoute(id, locale, { history: true });

  if (route.type === 'redirect') {
    permanentRedirect(route.destination);
  }
  if (route.type === 'notFound') {
    notFound();
  }

  const labels = await buildRestockHistoryPageProps(route.shop);

  return (
    <>
      <SetMainColor color={`${route.shop.color}a6`} />
      <RestockHistoryPageContent locale={locale} shopInfo={route.shop} labels={labels} />
    </>
  );
}
