import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { EventsCompactDemo } from './EventsCompactDemo';

const TITLE = 'NC Mall Events — Compact concept';
const DESCRIPTION =
  'Design mockup of compact link cards for the NC Mall hub events and attractions section.';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/events-compact',
    noindex: true,
    nofollow: true,
  });
}

export default function EventsCompactPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <EventsCompactDemo />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
