import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import { setRequestLocale } from 'next-intl/server';
import type { UserList } from '@types';
import { FaerieFestivalPageContent } from './FaerieFestivalPageContent';

const EVENT_YEAR = 2025;
const mainColor = '#9b65c0c7';
const themeColor = '#9b65c0';
const ogImage = 'https://images.neopets.com/homepage/marquee/icons/faeriefestival_event_icon.png';

type FaerieFestivalPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: FaerieFestivalPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageProps = getStaticAppPageProps(locale, {
    title: 'Faerie Festival Guide',
    description: 'Find the best items to recycle for the Faerie Festival event!',
    pathname: '/hub/faeriefestival',
  });

  return {
    ...pageProps.metadata,
    themeColor,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [{ url: ogImage, width: 300, height: 300, alt: 'Faeries Festival' }],
    },
  };
}

export default function FaerieFestivalPage({ params }: FaerieFestivalPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <FaerieFestivalPageContentWrapper params={params} />
    </Suspense>
  );
}

async function FaerieFestivalPageContentWrapper({ params }: FaerieFestivalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lists = await loadFaerieFestivalLists();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <FaerieFestivalPageContent lists={lists} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadFaerieFestivalLists(): Promise<UserList[]> {
  'use cache';
  cacheTag('hub-faeriefestival');
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  return (await getTrendingCatLists('Faerie Festival', 100)).filter(
    (list) => new Date(list.createdAt).getFullYear() === EVENT_YEAR
  );
}
