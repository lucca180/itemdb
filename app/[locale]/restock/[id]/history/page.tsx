import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import {
  getRestockShopPathname,
  resolveRestockShopForMetadata,
  resolveRestockShopRoute,
} from '@app/utils/resolveRestockShopRoute';
import { setRequestLocale } from 'next-intl/server';
import {
  buildRestockHistoryPageMetadata,
  buildRestockHistoryPageProps,
} from './buildRestockHistoryPageProps';
import { RestockHistoryPageContent } from './RestockHistoryPageContent';

type RestockHistoryPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: RestockHistoryPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const shopInfo = resolveRestockShopForMetadata(id);
  if (!shopInfo) return {};

  const { title, description } = await buildRestockHistoryPageMetadata(shopInfo);

  const pageProps = getStaticAppPageProps(locale, {
    title,
    description,
    pathname: getRestockShopPathname(shopInfo, true),
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

export default function RestockHistoryPage({ params }: RestockHistoryPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <RestockHistoryPageContentWrapper params={params} />
    </Suspense>
  );
}

async function RestockHistoryPageContentWrapper({ params }: RestockHistoryPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const route = resolveRestockShopRoute(id, locale, { history: true });

  if (route.type === 'redirect') {
    permanentRedirect(route.destination);
  }
  if (route.type === 'notFound') {
    notFound();
  }

  const labels = await buildRestockHistoryPageProps(route.shop);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={`${route.shop.color}a6`}>
      <RestockHistoryPageContent locale={locale} shopInfo={route.shop} labels={labels} />
    </AppServerLayout>
  );
}
