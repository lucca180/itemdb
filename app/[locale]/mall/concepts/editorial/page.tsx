import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { EditorialMallHubContent } from './EditorialMallHubContent';

const TITLE = 'NC Mall Hub — Editorial concept';
const DESCRIPTION =
  'Design mockup of an editorial NC Mall hub: cover story drop, Lebron value desk, and magazine strips for sales, leaving items, events, and Pet Styles.';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/editorial',
    noindex: true,
    nofollow: true,
  });
}

export default function EditorialMallHubPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <EditorialMallHubContent />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
