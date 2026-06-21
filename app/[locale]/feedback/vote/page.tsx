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
import { buildFeedbackVotePageProps } from './buildFeedbackVotePageProps';
import { FeedbackVotePageClient } from './FeedbackVotePageClient';

const mainColor = '#4A5568c7';

type FeedbackVotePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    target?: string;
    wishlist?: string;
    order?: string;
  }>;
};

export async function generateMetadata({ params }: FeedbackVotePageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return getStaticAppPageProps(locale, {
    title: t('Feedback.voting-feedback'),
    description: t('Feedback.feedback-system-description'),
    pathname: '/feedback/vote',
    noindex: true,
  }).metadata;
}

export default function FeedbackVotePage({ params, searchParams }: FeedbackVotePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <FeedbackVotePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function FeedbackVotePageContent({ params, searchParams }: FeedbackVotePageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const labels = await buildFeedbackVotePageProps(locale);

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
      <FeedbackVotePageClient
        shouldShowReminder={labels.shouldShowReminder}
        target={query.target}
        wishlist={query.wishlist}
        order={query.order}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
