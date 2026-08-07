import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildDataCollectingPageProps } from './buildDataCollectingPageProps';
import { DataCollectingPageClient } from './DataCollectingPageClient';

const mainColor = '#abf14ec7';

type DataCollectingPageRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return await getStaticAppMetadata({
    title: 'Data Collecting Tool',
    description: t('Feedback.feedback-system-description'),
    pathname: '/tools/data-collecting',
    noindex: true,
  });
}

export default function DataCollectingPage({ params }: DataCollectingPageRouteProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <DataCollectingPageContent params={params} />
    </Suspense>
  );
}

async function DataCollectingPageContent({ params }: DataCollectingPageRouteProps) {
  const { locale } = await params;
  await buildDataCollectingPageProps(locale);

  return (
    <>
      <SetMainColor color={mainColor} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_982.gif',
          alt: 'quiz-giver thumbnail',
        }}
        color="#b4ff53"
      >
        <Heading as="h1" size="lg">
          Data Collecting Tool
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>
          This tool is designed to help us collect certain data that we can&apos;t capture
          automatically (mostly some prize pools)
        </Text>
      </HeaderCard>
      <DataCollectingPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
