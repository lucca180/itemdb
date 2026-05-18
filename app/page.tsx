import type { Metadata } from 'next';
import Color from 'color';
import { Fragment, Suspense } from 'react';
import { Flex, Grid, styled } from '@styled/jsx';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import AppServerLayout from '@app/_components/layout/AppServerLayout';
import { getItemDbCanonical, normalizeItemDbLocale } from '@utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { loadTranslation } from '@utils/load-translation';
import { HomeHero } from './_components/Home/Sections/HomeHero';
import {
  FeaturedListsHomeCard,
  LeavingNcMallHomeCard,
  LatestItemsHomeCard,
  LatestWearableHomeCard,
  TrendingItemsHomeCard,
  LatestNcMallHomeCard,
} from '@app/_components/Home/Cards/HomeServerCards';
import { TVWHomeCard } from '@app/_components/Home/Cards/EventCard';
import { NewItemsCountSection } from '@app/_components/Home/Cards/NewItemsCountSection';
import { LatestArticlesSection } from './_components/Home/Sections/LatestArticlesSection';
import { LatestPricesSection } from './_components/Home/Sections/LatestPricesSection';
import StatsCard, { StatsCardLoading } from './_components/Home/Cards/StatsCard';

export const revalidate = 180;

const mainColor = Color('#4A5568').alpha(0.9).hexa();

async function getHomePageDescription(locale: string) {
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });

  return t('HomePage.seo-description');
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

  return (
    <AppServerLayout disableNextSeo mainColor={mainColor}>
      <HomeHero
        title={t('HomePage.title')}
        highlightQuery={t('HomePage.open-source')}
        safetyLinkLabel={t('HomePage.is-it-safe')}
      />
      <Flex mt={8} gap={8} flexFlow="column">
        <LatestPricesSection />
        <TVWHomeCard />
        <NewItemsCountSection />
        <Grid
          gridTemplateColumns={{ base: 'minmax(0, 1fr)', lg: 'repeat(3, minmax(0, 1fr))' }}
          gap={{ base: 4, xl: 8 }}
          justifyItems="center"
        >
          <Fragment key="latest-items-card">
            <LatestItemsHomeCard />
          </Fragment>
          <Fragment key="trending-items-card">
            <TrendingItemsHomeCard />
          </Fragment>
          <Fragment key="latest-nc-mall-card">
            <LatestNcMallHomeCard />
          </Fragment>
        </Grid>
        <FeaturedListsHomeCard />
        <Flex flexDirection={{ base: 'column', lg: 'row' }} gap={{ base: 4, xl: 8 }}>
          <LeavingNcMallHomeCard />
          <LatestWearableHomeCard />
        </Flex>
        <Flex flexDirection={{ base: 'column', lg: 'row' }} mt={2} gap={{ base: 8, lg: 3 }}>
          <Flex flexFlow="column" flex={1} alignItems="center">
            <styled.h2 fontSize="xl" fontWeight="semibold" lineHeight="1.2" mb={{ base: 5, lg: 0 }}>
              {t('HomePage.stats')}
            </styled.h2>
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
          </Flex>
          <LatestArticlesSection title={t('HomePage.latest-articles')} />
        </Flex>
      </Flex>
    </AppServerLayout>
  );
}
