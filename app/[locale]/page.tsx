import type { Metadata } from 'next';
import Color from 'color';
import { Fragment, Suspense } from 'react';
import { Flex, Grid, Heading } from '@chakra-ui/react';
import { createTranslator } from 'next-intl';
import { HomeHero } from '@components/Home/HomeHero';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { getItemDbCanonical, normalizeItemDbLocale } from '@app/utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { loadTranslation } from '@utils/load-translation';
import {
  FeaturedListsHomeCard,
  LeavingNcMallHomeCard,
  LatestItemsHomeCard,
  LatestWearableHomeCard,
  TrendingItemsHomeCard,
  LatestNcMallHomeCard,
} from '@app/_components/Home/Cards/HomeServerCards';
import { NewItemsCountSection } from '@app/_components/Home/Cards/NewItemsCountSection';
import { LatestArticlesSection } from '@app/_components/Home/Sections/LatestArticlesSection';
import { LatestPricesSection } from '@app/_components/Home/Sections/LatestPricesSection';
import StatsCard, { StatsCardLoading } from '@app/_components/Home/Cards/StatsCard';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@i18n/routing';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
// import { CupHomeCard } from '@app/_components/Home/Cards/EventCard';

const mainColor = Color('#4A5568').alpha(0.9).hexa();

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

async function getHomePageDescription(locale: string) {
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });

  return t('HomePage.seo-description');
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
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

export default function HomePage({ params }: HomePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <HomePageContent params={params} />
    </Suspense>
  );
}

async function HomePageContent({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await loadTranslation(locale, 'page', true);
  const t = createTranslator({ messages, locale });

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <HomeHero
        title={t('HomePage.title')}
        highlightQuery={t('HomePage.open-source')}
        safetyLinkLabel={t('HomePage.is-it-safe')}
      />
      <Flex mt={8} gap={8} flexDirection="column">
        <LatestPricesSection />
        {/* <CupHomeCard /> */}
        <NewItemsCountSection />
        <Grid
          templateColumns={{ base: 'minmax(0, 1fr)', lg: 'repeat(3, minmax(0, 1fr))' }}
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
        <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 4, xl: 8 }}>
          <LeavingNcMallHomeCard />
          <LatestWearableHomeCard />
        </Flex>
        <Flex direction={{ base: 'column', lg: 'row' }} mt={2} gap={{ base: 8, lg: 3 }}>
          <Flex direction="column" flex={1} alignItems="center">
            <Heading as="h2" size="md" lineHeight="1.2" mb={{ base: 5, lg: 0 }}>
              {t('HomePage.stats')}
            </Heading>
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
