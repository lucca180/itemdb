import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getNCMallData, getNCMallItemsData } from '@pages/api/v1/mall';
import { getTranslations } from 'next-intl/server';
import type { ItemData, NCMallData } from '@types';
import { buildLeavingMallPageProps } from './buildLeavingMallPageProps';
import { LeavingMallPageContent } from './LeavingMallPageContent';

const mainColor = 'rgba(205, 193, 255, 0.58)';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metaDescription =
    t
      .rich('NcMall.leaving-soon-desc', {
        Link: (chunk) => chunk,
      })
      ?.toString() ?? '';

  const metadata = await getStaticAppMetadata({
    title: `${t('NcMall.leaving-soon-tm')} | Neopets NC Mall`,
    description: metaDescription,
    pathname: '/mall/leaving',
  });

  return {
    ...metadata,
  };
}

export default function LeavingMallPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <LeavingMallPageContentWrapper />
    </Suspense>
  );
}

async function LeavingMallPageContentWrapper() {
  const { mallData, itemData } = await loadLeavingMallItems();
  const labels = await buildLeavingMallPageProps(mallData, itemData);

  return (
    <>
      <SetMainColor color={mainColor} />
      <LeavingMallPageContent
        title={labels.title}
        description={labels.description}
        itemsByDate={labels.itemsByDate}
        itemData={labels.itemData}
      />
    </>
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
