import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTVWLists } from '@pages/api/v1/beta/trending';
import { setRequestLocale } from 'next-intl/server';
import type { UserList } from '@types';
import { TheVoidWithinPageContent } from './TheVoidWithinPageContent';

const mainColor = '#8564df';
const themeColor = '#8564df';
const ogImage = 'https://images.neopets.com/plots/tvw/rewards/images/achievements/94n7e5ffbi.png';

type TheVoidWithinPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TheVoidWithinPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageProps = getStaticAppPageProps(locale, {
    title: 'The Void Within Plot Prize Guide',
    description:
      "Nyx and the Gang are back into Neopia's epic struggle against the immutable, grey, and shadowy shades threatening to overtake the planet in The Void Within Neopets Plot! Find the best prizes and guides to help you get the best many neopoints on The Void Within plot",
    pathname: '/hub/the-void-within',
  });

  return {
    ...pageProps.metadata,
    themeColor,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [{ url: ogImage, width: 150, height: 150, alt: 'The Void Within Plot Paint Brush' }],
    },
  };
}

export default function TheVoidWithinPage({ params }: TheVoidWithinPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <TheVoidWithinPageContentWrapper params={params} />
    </Suspense>
  );
}

async function TheVoidWithinPageContentWrapper({ params }: TheVoidWithinPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lists = await loadTheVoidWithinLists();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <TheVoidWithinPageContent lists={lists} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadTheVoidWithinLists(): Promise<UserList[]> {
  'use cache';
  cacheTag('hub-the-void-within');
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  return getTVWLists(3000);
}
