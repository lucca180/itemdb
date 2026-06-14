import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getFolderMeta } from '@utils/googleCloud';
import { setRequestLocale } from 'next-intl/server';
import { PublicDataPageContent } from './PublicDataPageContent';
import { mapS3ObjectToExport, staticPublicDataExports } from './publicData';

const mainColor = '#6c8ab3c7';

type PublicDataPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PublicDataPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageProps = getStaticAppPageProps(locale, {
    title: 'itemdb Public Data',
    pathname: '/public-data',
    noindex: true,
  });

  return pageProps.metadata;
}

export default function PublicDataPage({ params }: PublicDataPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <PublicDataPageContentWrapper params={params} />
    </Suspense>
  );
}

async function PublicDataPageContentWrapper({ params }: PublicDataPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dumps = await loadPublicDataExports();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <PublicDataPageContent dumps={dumps} />
    </AppServerLayout>
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
