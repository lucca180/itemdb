import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { EventsHeroDemo } from './EventsHeroDemo';

const TITLE = 'NC Mall Events — Hero concept';
const DESCRIPTION =
  'Design mockup of a hero + siblings layout for the NC Mall hub events and attractions section.';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/events-hero',
    noindex: true,
    nofollow: true,
  });
}

export default function EventsHeroPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <EventsHeroDemo />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
