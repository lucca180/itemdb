import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { GoalsPageClient } from './GoalsPageClient';
import { GOALS_ACCENT } from './goalsPageData';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('GoalsTool');
  const title = t('seo-title');
  const metadata = await getStaticAppMetadata({
    title,
    description: t('seo-description'),
    pathname: '/tools/goals',
  });

  return {
    ...metadata,
    title: { absolute: title },
  };
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={`${GOALS_ACCENT}c7`} />
      <GoalsPageClient />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
