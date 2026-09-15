import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { loadFaerieFestivalLists } from './_data';
import { ogImageUrl, seoDescription, seoTitle } from './_event';
import { FaerieFestivalPageContent } from './FaerieFestivalPageContent';

const mainColor = '#e85fb0c7';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getStaticAppMetadata({
    title: seoTitle,
    description: seoDescription,
    pathname: '/hub/faeriefestival',
  });

  return {
    ...metadata,
    title: { absolute: seoTitle },
    twitter: {
      ...metadata.twitter,
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
    },
    openGraph: {
      ...metadata.openGraph,
      title: seoTitle,
      description: seoDescription,
      images: [{ url: ogImageUrl, alt: seoTitle }],
    },
  };
}

export default function FaerieFestivalPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <FaerieFestivalPageContentWrapper />
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function FaerieFestivalPageContentWrapper() {
  const lists = await loadFaerieFestivalLists();

  return (
    <>
      <SetMainColor color={mainColor} />
      <FaerieFestivalPageContent lists={lists} />
    </>
  );
}
