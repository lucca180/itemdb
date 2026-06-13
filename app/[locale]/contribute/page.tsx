import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppPageProps } from '@utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildContributePageProps } from './buildContributePageProps';
import { ContributePageClient } from './ContributePageClient';

const mainColor = '#4974f5c7';
const ogImage = {
  url: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
  width: 150,
  height: 150,
};

type ContributePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContributePageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('Layout.how-to-contribute'),
    description: t('Feedback.contribute-description'),
    pathname: '/contribute',
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      images: [ogImage],
    },
  };
}

export default function ContributePage({ params }: ContributePageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <ContributePageContent params={params} />
    </Suspense>
  );
}

async function ContributePageContent({ params }: ContributePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildContributePageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
          alt: 'helper acara thumbnail',
        }}
        color="#4974F5"
        breadcrumb={
          <BreadcrumbsView breadcrumbList={labels.breadcrumbList} locale={locale} useAppDir />
        }
      >
        <Heading as="h1" size="lg">
          {labels.heading}
        </Heading>
        <Text as="h2">{labels.description}</Text>
      </HeaderCard>
      <ContributePageClient tabLabels={labels.tabLabels} tabContent={labels.tabContent} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
