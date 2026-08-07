import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTVWLists } from '@pages/api/v1/beta/trending';
import type { UserList } from '@types';
import { TheVoidWithinPageContent } from './TheVoidWithinPageContent';

const mainColor = '#8564df';
const ogImage = 'https://images.neopets.com/plots/tvw/rewards/images/achievements/94n7e5ffbi.png';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getStaticAppMetadata({
    title: 'The Void Within Plot Prize Guide',
    description:
      "Nyx and the Gang are back into Neopia's epic struggle against the immutable, grey, and shadowy shades threatening to overtake the planet in The Void Within Neopets Plot! Find the best prizes and guides to help you get the best many neopoints on The Void Within plot",
    pathname: '/hub/the-void-within',
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: ogImage, width: 150, height: 150, alt: 'The Void Within Plot Paint Brush' }],
    },
  };
}

export default function TheVoidWithinPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <TheVoidWithinPageContentWrapper />
    </Suspense>
  );
}

async function TheVoidWithinPageContentWrapper() {
  const lists = await loadTheVoidWithinLists();

  return (
    <>
      <SetMainColor color={mainColor} />
      <TheVoidWithinPageContent lists={lists} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function loadTheVoidWithinLists(): Promise<UserList[]> {
  'use cache';
  cacheTag('hub-the-void-within');
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  try {
    return await getTVWLists(3000);
  } catch {
    return [];
  }
}
