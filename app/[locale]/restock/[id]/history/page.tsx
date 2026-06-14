import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPathname } from '@i18n/navigation';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@utils/appPage';
import { setRequestLocale } from 'next-intl/server';
import type { ShopInfo } from '@types';
import { restockShopInfo, slugify } from '@utils/utils';
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
  const shopInfo = resolveRestockShopSlug(id);
  if (!shopInfo) return {};

  const { title, description } = await buildRestockHistoryPageMetadata(shopInfo);

  const pageProps = getStaticAppPageProps(locale, {
    title,
    description,
    pathname: `/restock/${id}/history`,
  });

  return {
    ...pageProps.metadata,
    themeColor: shopInfo.color,
    twitter: { card: 'summary_large_image' },
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

  if (!Number.isNaN(Number(id))) {
    const shopById = restockShopInfo[id];
    if (shopById) {
      permanentRedirect(
        getPathname({ locale, href: `/restock/${slugify(shopById.name)}/history` })
      );
    }
    notFound();
  }

  const shopInfo = resolveRestockShopSlug(id);
  if (!shopInfo || Number(shopInfo.id) < 0) notFound();

  const labels = await buildRestockHistoryPageProps(shopInfo);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={`${shopInfo.color}a6`}>
      <RestockHistoryPageContent locale={locale} shopInfo={shopInfo} labels={labels} />
    </AppServerLayout>
  );
}

function resolveRestockShopSlug(id: string): ShopInfo | null {
  return Object.values(restockShopInfo).find((shop) => slugify(shop.name) === id) ?? null;
}
