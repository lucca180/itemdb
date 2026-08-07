import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getFolderMeta } from '@utils/googleCloud';
import { PublicDataPageContent } from './PublicDataPageContent';
import { mapS3ObjectToExport, staticPublicDataExports } from './publicData';

const mainColor = '#6c8ab3c7';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getStaticAppMetadata({
    title: 'itemdb Public Data',
    pathname: '/public-data',
    noindex: true,
  });

  return metadata;
}

export default function PublicDataPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PublicDataPageContentWrapper />
    </Suspense>
  );
}

async function PublicDataPageContentWrapper() {
  const dumps = await loadPublicDataExports();

  return (
    <>
      <SetMainColor color={mainColor} />
      <PublicDataPageContent dumps={dumps} />
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

  const objects = await getFolderMeta('dumps/');
  const s3Exports = objects.map(mapS3ObjectToExport).filter((entry) => entry !== null);

  return [...s3Exports, ...staticPublicDataExports];
}
