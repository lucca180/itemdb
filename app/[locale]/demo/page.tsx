import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { MOCK_REVIEW } from '@components/Hubs/RestockReview/mockData';
import { ReviewStories } from '@components/Hubs/RestockReview/ReviewStories';
import { routing } from '@utils/locales';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('RestockReview');

  return await getStaticAppMetadata({
    title: t('seo-title', { year: MOCK_REVIEW.year }),
    description: t('seo-description', { year: MOCK_REVIEW.year }),
    pathname: '/demo',
    noindex: true,
    nofollow: true,
  });
}

export default function RestockReviewDemoPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color="#58ab7cc7" />
      <ReviewStories data={MOCK_REVIEW} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
