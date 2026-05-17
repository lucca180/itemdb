import type { Metadata } from 'next';
import Color from 'color';
import { Suspense } from 'react';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import Layout from '@components/Layout';
import { getItemDbCanonical, normalizeItemDbLocale } from '@utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { loadTranslation } from '@utils/load-translation';
import { HomeHero } from './_components/Home/HomeHero';
import {
  HomePageClient,
  type HomePageClientProps,
  type LatestPricesRes,
} from './_components/Home/HomePageClient';
import { LatestArticlesSection } from './_components/Home/LatestArticlesSection';
import StatsCard, { StatsCardLoading } from './_components/Home/StatsCard';
import {
  getTrendingCatLists,
  getTrendingItems,
  getTrendingLists,
} from '../pages/api/v1/beta/trending';
import { getNewItemsInfo } from '../pages/api/v1/beta/new-items';
import { getLatestItems } from '../pages/api/v1/items/index';
import { getNCMallItemsData } from '../pages/api/v1/mall/index';
import { getLatestPricedItems } from '../pages/api/v1/prices/index';

export const revalidate = 180;

const mainColor = Color('#4A5568').alpha(0.9).hexa();

async function getHomePageDescription(locale: string) {
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });

  return t('HomePage.seo-description');
}

async function getHomePageData(): Promise<HomePageClientProps> {
  const latestPricesPromise: Promise<LatestPricesRes> = getLatestPricedItems(16, true)
    .then((result) => result as LatestPricesRes)
    .catch(() => ({
      items: [],
      count: null,
    }));

  const [
    latestItems,
    latestWearable,
    trendingItems,
    latestNcMall,
    latestPrices,
    leavingNcMall,
    trendingLists,
    newItemCount,
    eventLists,
  ] = await Promise.all([
    getLatestItems(20, true).catch(() => []),
    getLatestItems(18, true, true).catch(() => []),
    getTrendingItems(20).catch(() => []),
    getNCMallItemsData(20).catch(() => []),
    latestPricesPromise,
    getNCMallItemsData(18, true).catch(() => []),
    getTrendingLists(3, ['The Void Within']).catch(() => []),
    getNewItemsInfo(7).catch(() => null),
    getTrendingCatLists('The Void Within', 3).catch(() => []),
  ]);

  return {
    hero: null,
    latestArticlesSection: null,
    statsSection: null,
    latestItems,
    latestWearable,
    trendingItems,
    latestNcMall,
    latestPrices,
    leavingNcMall,
    trendingLists,
    newItemCount,
    eventLists,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const normalizedLocale = normalizeItemDbLocale(locale);
  const canonical = getItemDbCanonical('/', normalizedLocale);
  const description = await getHomePageDescription(locale);
  const defaultSeo = getDefaultSEO(locale);

  return {
    title: defaultSeo.defaultTitle,
    description,
    alternates: {
      canonical,
      languages: {
        en: getItemDbCanonical('/', 'en'),
        pt: getItemDbCanonical('/', 'pt'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: defaultSeo.defaultTitle,
      description,
      siteName: defaultSeo.openGraph?.siteName,
      locale: defaultSeo.openGraph?.locale,
      images: defaultSeo.openGraph?.images?.map((image) => ({
        url: image.url,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
        alt: image.alt ?? undefined,
      })),
    },
    twitter: {
      card: 'summary',
      site: defaultSeo.twitter?.site,
      title: defaultSeo.defaultTitle,
      description,
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });
  const data = await getHomePageData();

  return (
    <Layout disableNextSeo mainColor={mainColor}>
      <HomePageClient
        {...data}
        hero={
          <HomeHero
            title={t('HomePage.title')}
            highlightQuery={t('HomePage.open-source')}
            safetyLinkLabel={t('HomePage.is-it-safe')}
          />
        }
        latestArticlesSection={<LatestArticlesSection title={t('HomePage.latest-articles')} />}
        statsSection={
          <Suspense
            fallback={
              <StatsCardLoading
                itemsInDbLabel={t('BetaStats.items-in-db')}
                completeItemsLabel={t('BetaStats.complete-items')}
                processQueueLabel={t('BetaStats.process-queue')}
                tradePricingQueueLabel={t('BetaStats.trade-pricing-queue')}
                feedbackVotingQueueLabel={t('BetaStats.feedback-voting-queue')}
              />
            }
          >
            <StatsCard />
          </Suspense>
        }
      />
    </Layout>
  );
}
