import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { getTrendingItems, getTrendingLists } from '@pages/api/v1/beta/trending';
import { getLatestItems } from '@pages/api/v1/items/index';
import { getNCMallItemsData } from '@pages/api/v1/mall/index';
import { HomeCard } from './HomeCard';
import { HorizontalHomeCard } from './HorizontalHomeCard';
import { FeaturedListsGrid } from './FeaturedListsGrid';

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

const getCachedLeavingNcMallItems = unstable_cache(
  async () => getNCMallItemsData(18, true).catch(() => []),
  ['home-server-cards', 'leaving-nc-mall'],
  {
    tags: ['home-latest-nc-mall'],
    revalidate: 600,
  }
);

const getCachedLatestWearableItems = unstable_cache(
  async () => getLatestItems(18, true, true).catch(() => []),
  ['home-server-cards', 'latest-wearable'],
  {
    tags: ['home-latest-wearable-items'],
    revalidate: 300,
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

const getCachedFeaturedLists = unstable_cache(
  async () => getTrendingLists(3, ['The Void Within']).catch(() => []),
  ['home-server-cards', 'featured-lists'],
  {
    tags: ['home-trending-lists'],
    revalidate: 3600,
  }
);

export function LatestItemsHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard
          title="Latest Discoveries"
          color="#e7db7a"
          image={'/icons/discoveries.png'}
          isLoading
        />
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
      image={'/icons/discoveries.png'}
      items={items}
      title={t('HomePage.latest-discoveries')}
    />
  );
}

export function TrendingItemsHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard
          title="Trending Items"
          color="#AE445A"
          image={'/icons/trending-items.png'}
          isLoading
        />
      }
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
      image={'/icons/trending-items.png'}
      items={items}
    />
  );
}

export function FeaturedListsHomeCard() {
  return (
    <Suspense
      fallback={
        <HorizontalHomeCard
          color="#4A5568"
          image="https://images.neopets.com/themes/h5/newyears/images/transferlog-icon.png"
          title="Featured Lists"
          viewAllLink="/lists/official"
          utm_content="featured-lists"
        />
      }
    >
      <FeaturedListsHomeCardContent />
    </Suspense>
  );
}

async function FeaturedListsHomeCardContent() {
  const t = await getTranslations();
  const lists = await getCachedFeaturedLists();

  return (
    <HorizontalHomeCard
      color="#4A5568"
      image="https://images.neopets.com/themes/h5/newyears/images/transferlog-icon.png"
      title={t('HomePage.featured-lists')}
      viewAllLink="/lists/official"
      utm_content="featured-lists"
    >
      <FeaturedListsGrid lists={lists} />
    </HorizontalHomeCard>
  );
}

export function LatestNcMallHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard title="New in NC Mall" color="#BED754" image={'/icons/nc.png'} isLoading />
      }
    >
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
      image={'/icons/nc.png'}
      items={items}
    />
  );
}

export function LeavingNcMallHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard
          useItemCard
          title="Leaving NC Mall"
          color="#CB9DF0"
          image="https://images.neopets.com/themes/h5/altadorcup/images/calendar-icon.png"
          h={70}
          w={70}
          perPage={9}
          isLoading
        />
      }
    >
      <LeavingNcMallHomeCardContent />
    </Suspense>
  );
}

async function LeavingNcMallHomeCardContent() {
  const t = await getTranslations();
  const items = await getCachedLeavingNcMallItems();

  return (
    <HomeCard
      useItemCard
      href="/mall/leaving"
      utm_content="leaving-nc-mall"
      color="#CB9DF0"
      image="https://images.neopets.com/themes/h5/altadorcup/images/calendar-icon.png"
      items={items}
      title={t('HomePage.leaving-nc-mall')}
      h={70}
      w={70}
      perPage={9}
    />
  );
}

export function LatestWearableHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard
          useItemCard
          title="New Clothes"
          color="#59cde2"
          image="https://images.neopets.com/themes/h5/basic/images/customise-icon.svg"
          w={70}
          h={70}
          perPage={9}
          isLoading
        />
      }
    >
      <LatestWearableHomeCardContent />
    </Suspense>
  );
}

async function LatestWearableHomeCardContent() {
  const t = await getTranslations();
  const items = await getCachedLatestWearableItems();

  return (
    <HomeCard
      useItemCard
      utm_content="latest-wearable"
      href="/search?s=&sortBy=added&sortDir=desc&type[]=wearable&utm_content=latest-wearable"
      color="#59cde2"
      image="https://images.neopets.com/themes/h5/basic/images/customise-icon.svg"
      items={items}
      title={t('HomePage.new-clothes')}
      w={70}
      h={70}
      perPage={9}
    />
  );
}
