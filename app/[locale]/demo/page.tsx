import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { MOCK_REVIEW } from '@components/Hubs/RestockReview/mockData';
import { ReviewHub } from '@components/Hubs/RestockReview/ReviewHub';
import { routing } from '@utils/locales';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ReviewGeneral');

  return await getStaticAppMetadata({
    title: t('seo-title', { year: MOCK_REVIEW.year }),
    description: t('seo-description', { year: MOCK_REVIEW.year }),
    pathname: '/demo',
    noindex: true,
    nofollow: true,
  });
}

export default function ReviewDemoPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color="#58ab7cc7" />
      <ReviewHub year={MOCK_REVIEW.year} restock={MOCK_REVIEW} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
