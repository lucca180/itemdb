import type { Metadata } from 'next';
import Color from 'color';
import { Suspense } from 'react';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import Layout from '@components/Layout';
import { getItemDbCanonical, normalizeItemDbLocale } from '@utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { loadTranslation } from '@utils/load-translation';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import { getNewItemsInfo } from '@pages/api/v1/beta/new-items';
import { HomeHero } from './_components/Home/Sections/HomeHero';
import { HomePageClient } from './_components/Home/HomePageClient';
import {
  FeaturedListsHomeCard,
  LeavingNcMallHomeCard,
  LatestItemsHomeCard,
  LatestWearableHomeCard,
  TrendingItemsHomeCard,
  LatestNcMallHomeCard,
} from './_components/Home/Cards/HomeServerCards';
import { LatestArticlesSection } from './_components/Home/Sections/LatestArticlesSection';
import { LatestPricesSection } from './_components/Home/Sections/LatestPricesSection';
import StatsCard, { StatsCardLoading } from './_components/Home/Cards/StatsCard';
import { unstable_cache } from 'next/cache';

export const revalidate = 180;

const mainColor = Color('#4A5568').alpha(0.9).hexa();

async function getHomePageDescription(locale: string) {
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });

  return t('HomePage.seo-description');
}

const cachedTrendingCatLists = unstable_cache(
  () => getTrendingCatLists('The Void Within', 3).catch(() => []),
  ['home-page-trending-cat-lists'],
  {
    tags: ['home-trending-cat-lists'],
    revalidate: 3600,
  }
);

const cachedNewItemCount = unstable_cache(
  () => getNewItemsInfo(7).catch(() => null),
  ['home-page-new-item-count'],
  {
    tags: ['home-new-item-count'],
    revalidate: 300,
  }
);

async function getHomePageData() {
  const [newItemCount, eventLists] = await Promise.all([
    cachedNewItemCount(),
    cachedTrendingCatLists(),
  ]);

  return {
    hero: null,
    latestArticlesSection: null,
    statsSection: null,
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
  const homePageClientData = await getHomePageData();

  return (
    <Layout disableNextSeo mainColor={mainColor}>
      <HomePageClient
        {...homePageClientData}
        hero={
          <HomeHero
            title={t('HomePage.title')}
            highlightQuery={t('HomePage.open-source')}
            safetyLinkLabel={t('HomePage.is-it-safe')}
          />
        }
        latestItemsCard={<LatestItemsHomeCard />}
        trendingItemsCard={<TrendingItemsHomeCard />}
        featuredListsCard={<FeaturedListsHomeCard />}
        latestNcMallCard={<LatestNcMallHomeCard />}
        leavingNcMallCard={<LeavingNcMallHomeCard />}
        latestWearableCard={<LatestWearableHomeCard />}
        latestPricesSection={<LatestPricesSection />}
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
