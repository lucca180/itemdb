import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { getTrendingItems } from '@pages/api/v1/beta/trending';
import { getLatestItems } from '@pages/api/v1/items/index';
import { getNCMallItemsData } from '@pages/api/v1/mall/index';
import { HomeCard } from './HomeCard';
import nc from '@assets/icons/nc.png';
import discoveries from '@assets/icons/discoveries.png';
import trending from '@assets/icons/trending-items.png';

const getCachedLatestItems = unstable_cache(
  async () => getLatestItems(20, true).catch(() => []),
  ['home-server-cards', 'latest-items'],
  {
    tags: ['home-latest-items'],
    revalidate: 300,
  }
);

const getCachedLatestNcMallItems = unstable_cache(
  async () => getNCMallItemsData(20).catch(() => []),
  ['home-server-cards', 'latest-nc-mall'],
  {
    tags: ['home-latest-nc-mall'],
    revalidate: 600,
  }
);

const getCachedTrendingItems = unstable_cache(
  async () => getTrendingItems(20).catch(() => []),
  ['home-server-cards', 'trending-items'],
  {
    tags: ['home-trending-items'],
    revalidate: 3600,
  }
);

export function LatestItemsHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard title="Latest Discoveries" color="#e7db7a" image={discoveries} isLoading />
      }
    >
      <LatestItemsHomeCardContent />
    </Suspense>
  );
}

async function LatestItemsHomeCardContent() {
  const t = await getTranslations();
  const items = await getCachedLatestItems();

  return (
    <HomeCard
      utm_content="latest-items"
      href="/search?s=&sortBy=added&sortDir=desc"
      color="#e7db7a"
      image={discoveries}
      items={items}
      title={t('HomePage.latest-discoveries')}
    />
  );
}

export function TrendingItemsHomeCard() {
  return (
    <Suspense
      fallback={<HomeCard title="Trending Items" color="#AE445A" image={trending} isLoading />}
    >
      <TrendingItemsHomeCardContent />
    </Suspense>
  );
}

async function TrendingItemsHomeCardContent() {
  const t = await getTranslations();
  const items = await getCachedTrendingItems();

  return (
    <HomeCard
      utm_content="trending-items"
      color="#AE445A"
      title={t('HomePage.trending-items')}
      image={trending}
      items={items}
    />
  );
}

export function LatestNcMallHomeCard() {
  return (
    <Suspense fallback={<HomeCard title="New in NC Mall" color="#BED754" image={nc} isLoading />}>
      <LatestNcMallHomeCardContent />
    </Suspense>
  );
}

async function LatestNcMallHomeCardContent() {
  const t = await getTranslations();
  const items = await getCachedLatestNcMallItems();

  return (
    <HomeCard
      utm_content="latest-nc-mall"
      color="#BED754"
      title={t('HomePage.new-in-nc-mall')}
      image={nc}
      items={items}
    />
  );
}
