import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { MonthlySpotlightDemo } from './MonthlySpotlightDemo';

const TITLE = 'NC Mall Hub — Monthly Spotlight concept';
const DESCRIPTION =
  'Design mockup of a Dyeworks-led monthly highlights section for the NC Mall hub.';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/monthly-spotlight',
    noindex: true,
    nofollow: true,
  });
}

export default function MonthlySpotlightPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <MonthlySpotlightDemo />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
