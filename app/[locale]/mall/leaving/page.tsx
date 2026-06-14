import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getNCMallData, getNCMallItemsData } from '@pages/api/v1/mall';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ItemData, NCMallData } from '@types';
import { buildLeavingMallPageProps } from './buildLeavingMallPageProps';
import { LeavingMallPageContent } from './LeavingMallPageContent';
const mainColor = 'rgba(205, 193, 255, 0.58)';
const themeColor = '#CDC1FF';

type LeavingMallPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LeavingMallPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const metaDescription =
    t
      .rich('NcMall.leaving-soon-desc', {
        Link: (chunk) => chunk,
      })
      ?.toString() ?? '';

  const pageProps = getStaticAppPageProps(locale, {
    title: `${t('NcMall.leaving-soon-tm')} | Neopets NC Mall`,
    description: metaDescription,
    pathname: '/mall/leaving',
  });

  return {
    ...pageProps.metadata,
    themeColor,
  };
}

export default function LeavingMallPage({ params }: LeavingMallPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <LeavingMallPageContentWrapper params={params} />
    </Suspense>
  );
}

async function LeavingMallPageContentWrapper({ params }: LeavingMallPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { mallData, itemData } = await loadLeavingMallItems();
  const labels = await buildLeavingMallPageProps(mallData, itemData);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <LeavingMallPageContent
        title={labels.title}
        description={labels.description}
        itemsByDate={labels.itemsByDate}
        itemData={labels.itemData}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadLeavingMallItems(): Promise<{ mallData: NCMallData[]; itemData: ItemData[] }> {
  'use cache';
  cacheTag('mall-leaving');
  cacheLife({ stale: 180, revalidate: 180, expire: 3600 });

  const [itemData, mallData] = await Promise.all([
    getNCMallItemsData(100, true),
    getNCMallData(100, true),
  ]);

  return { mallData, itemData };
}
