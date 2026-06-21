import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildFeedbackTradesPageProps } from './buildFeedbackTradesPageProps';
import { FeedbackTradesPageClient } from './FeedbackTradesPageClient';

const mainColor = '#4A5568c7';

type FeedbackTradesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    target?: string;
  }>;
};

export async function generateMetadata({ params }: FeedbackTradesPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return getStaticAppPageProps(locale, {
    title: t('Feedback.trade-pricing-feedback'),
    description: t('Feedback.feedback-system-description'),
    pathname: '/feedback/trades',
    noindex: true,
  }).metadata;
}

export default function FeedbackTradesPage({ params, searchParams }: FeedbackTradesPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <FeedbackTradesPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function FeedbackTradesPageContent({ params, searchParams }: FeedbackTradesPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const labels = await buildFeedbackTradesPageProps(locale);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        breadcrumb={
          <BreadcrumbsView breadcrumbList={labels.breadcrumbList} locale={locale} useAppDir />
        }
      >
        <Heading as="h1" size="lg">
          {labels.heading}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{labels.description}</Text>
      </HeaderCard>
      <FeedbackTradesPageClient
        shouldShowReminder={labels.shouldShowReminder}
        target={query.target}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
