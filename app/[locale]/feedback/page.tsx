import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildFeedbackPageProps } from './buildFeedbackPageProps';
import { FeedbackPageClient } from './FeedbackPageClient';

const mainColor = '#4A5568c7';

type FeedbackPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return await getStaticAppMetadata({
    title: 'Feedback',
    description: t('Feedback.feedback-system-description'),
    pathname: '/feedback',
  });
}

export default function FeedbackPage({ params }: FeedbackPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <FeedbackPageContent params={params} />
    </Suspense>
  );
}

async function FeedbackPageContent({ params }: FeedbackPageProps) {
  const { locale } = await params;
  const labels = await buildFeedbackPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
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
      <FeedbackPageClient cards={labels.cards} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
