import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getTrendingLists } from '@pages/api/v1/beta/trending';
import { ItemService } from '@services/ItemService';
import { loadRecentlyReleasedCombos } from '@app/server/rainbowPool';
import { HomeCard } from '@components/Card/HomeCard';
import { BirthdayHomeCard, HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { FeaturedListsGrid } from '@components/Home/FeaturedListsGrid';
import { ComboTile } from '@app/[locale]/rainbow-pool/components/ComboTile';
import type { UserList } from '@types';
import { getOfficialCategory } from '@app/[locale]/lists/official/_categories';
import { resolveCategory } from '@app/[locale]/lists/official/_categories/resolve';
import {
  loadOfficialCategoryLists,
  loadOfficialListPageviews,
} from '@app/[locale]/lists/official/loadOfficialLists';

async function getCachedLatestItems() {
  'use cache';
  cacheTag('home-latest-items');
  cacheLife('homeSection');
  return ItemService.getLatest(20, true).catch(() => []);
}

async function getCachedLatestNcMallItems() {
  'use cache';
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });
  return ItemService.getMall(20).catch(() => []);
}

async function getCachedLeavingNcMallItems() {
  'use cache';
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });
  return ItemService.getMall(12, true).catch(() => []);
}

async function getCachedTrendingItems() {
  'use cache';
  cacheTag('home-trending-items');
  cacheLife('homeSlow');
  return ItemService.getTrending(20).catch(() => []);
}

// The event card shows these lists, so Featured Lists skips them.
const BIRTHDAY_CATEGORY = 'neopets-anniversary';
const BIRTHDAY_TAG = 'Birthday Celebrations';
const BIRTHDAY_YEAR = 2026;

async function getCachedFeaturedLists() {
  'use cache';
  cacheTag('home-trending-lists');
  cacheLife('homeSlow');
  return getTrendingLists(3, [BIRTHDAY_TAG]).catch(() => []);
}

/**
 * This year's Birthday Celebration lists, most viewed first (Umami, last 30 days). Built from
 * the category page data, so lists created today show up before they have pageviews.
 */
async function getCachedBirthdayLists() {
  'use cache';
  cacheTag('home-event-card-lists');
  cacheLife('homeSlow');

  try {
    const category = getOfficialCategory(BIRTHDAY_CATEGORY);
    if (!category) return [];
    const [lists, pageviews] = await Promise.all([
      loadOfficialCategoryLists(BIRTHDAY_CATEGORY),
      loadOfficialListPageviews(),
    ]);
    const resolved = resolveCategory(category, lists, pageviews);
    if (resolved.type !== 'editions' || resolved.latest?.year !== BIRTHDAY_YEAR) return [];
    const views = (l: UserList) => pageviews[(l.slug ?? '').toLowerCase()] ?? 0;
    // Stable sort: lists without views keep the category's edition order.
    return [...resolved.latest.lists].sort((a, b) => views(b) - views(a));
  } catch {
    return [];
  }
}

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

export async function FeaturedListsHomeCard() {
  const t = await getTranslations();
  return (
    <Suspense
      fallback={
        <HorizontalHomeCard
          color="#4A5568"
          image="https://images.neopets.com/themes/h5/newyears/images/transferlog-icon.png"
          title={t('HomePage.featured-lists')}
          viewAllLink="/lists/official"
          viewAllText={t('General.view-all')}
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
      viewAllText={t('General.view-all')}
      utm_content="featured-lists"
    >
      <FeaturedListsGrid lists={lists} />
    </HorizontalHomeCard>
  );
}

export function BirthdayCelebrationHomeCard() {
  return (
    <Suspense fallback={<BirthdayHomeCard>{null}</BirthdayHomeCard>}>
      <BirthdayCelebrationHomeCardContent />
    </Suspense>
  );
}

async function BirthdayCelebrationHomeCardContent() {
  const lists = await getCachedBirthdayLists();
  if (!lists.length) return null;

  return (
    <BirthdayHomeCard>
      <FeaturedListsGrid lists={lists.slice(0, 3)} utmContent="birthday-lists" isSmall />
    </BirthdayHomeCard>
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
      href="/search?s=&type[]=ncBuyable&sortBy=added&sortDir=desc"
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
          title="Leaving NC Mall"
          color="#CB9DF0"
          image="https://images.neopets.com/themes/h5/altadorcup/images/calendar-icon.png"
          h={70}
          w={70}
          showMallLeaveDate
          perPage={6}
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
      showMallLeaveDate
      href="/mall/leaving"
      utm_content="leaving-nc-mall"
      color="#CB9DF0"
      image="https://images.neopets.com/themes/h5/altadorcup/images/calendar-icon.png"
      items={items}
      title={t('HomePage.leaving-nc-mall')}
      h={70}
      w={70}
      perPage={6}
    />
  );
}

export function RainbowPoolHomeCard() {
  return (
    <Suspense
      fallback={
        <HomeCard
          title="Rainbow Pool"
          color="#83dfff"
          image="https://images.neopets.com/themes/h5/basic/images/fondipdye-icon.png"
          href="/rainbow-pool"
          utm_content="home-rainbow-pool"
          h={50}
          w={50}
          perPage={6}
          isLoading
        />
      }
    >
      <RainbowPoolHomeCardContent />
    </Suspense>
  );
}

async function RainbowPoolHomeCardContent() {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const combos = await loadRecentlyReleasedCombos(12);

  return (
    <HomeCard
      color="#83dfff"
      image="https://images.neopets.com/themes/h5/basic/images/fondipdye-icon.png"
      title={t('HomePage.rainbow-pool')}
      href="/rainbow-pool"
      utm_content="home-rainbow-pool"
      h={50}
      w={50}
      perPage={6}
      bodyRows={combos.map((combo) => (
        <ComboTile
          key={combo.href}
          combo={combo}
          layout="row"
          releasedLabel={format.dateTime(combo.addedAt, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
      ))}
    />
  );
}
