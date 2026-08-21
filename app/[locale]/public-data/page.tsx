import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { DUMPS_BUCKET, getFolderMeta } from '@utils/googleCloud';
import { PublicDataPageContent } from './PublicDataPageContent';
import { mapS3ObjectToExport } from './publicData';
import { buildPublicDataPageProps } from './buildPublicDataPageProps';

const mainColor = '#6c8ab3c7';

type PublicDataPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getStaticAppMetadata({
    title: 'itemdb Public Data',
    pathname: '/public-data',
    noindex: true,
  });

  return metadata;
}

export default function PublicDataPage({ params }: PublicDataPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PublicDataPageContentWrapper params={params} />
    </Suspense>
  );
}

async function PublicDataPageContentWrapper({ params }: PublicDataPageProps) {
  const { locale } = await params;
  const { isNewAccount } = await buildPublicDataPageProps(locale);
  const dumps = isNewAccount ? [] : await loadPublicDataExports();

  return (
    <>
      <SetMainColor color={mainColor} />
      <PublicDataPageContent dumps={dumps} isNewAccount={isNewAccount} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadPublicDataExports() {
  'use cache';
  cacheTag('public-data-exports');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const objects = await getFolderMeta('', DUMPS_BUCKET);
  const s3Exports = objects.map(mapS3ObjectToExport).filter((entry) => entry !== null);

  return [...s3Exports];
}
