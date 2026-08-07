import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildMissingInfoPageProps } from './buildMissingInfoPageProps';
import { MissingInfoPageClient } from './MissingInfoPageClient';

const mainColor = 'rgba(240, 250, 148, 0.40)';

export async function generateMetadata(): Promise<Metadata> {
  const labels = await buildMissingInfoPageProps();
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('MissingHub.missing-info-hub'),
    description: labels.metaDescription,
    pathname: '/hub/missing-info',
  });

  return {
    ...metadata,
  };
}

export default function MissingInfoPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <MissingInfoPageContent />
    </Suspense>
  );
}

async function MissingInfoPageContent() {
  const labels = await buildMissingInfoPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
      <MissingInfoPageClient labels={labels} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
