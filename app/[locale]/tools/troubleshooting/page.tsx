import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { setRequestLocale } from 'next-intl/server';
import { buildTroubleshootingPageProps } from './buildTroubleshootingPageProps';
import { TroubleshootingPageClient } from './TroubleshootingPageClient';

const mainColor = '#ad3e8cc7';

type TroubleshootingPageRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TroubleshootingPageRouteProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return getStaticAppPageProps(locale, {
    title: 'Troubleshooting Tool',
    pathname: '/tools/troubleshooting',
    noindex: true,
  }).metadata;
}

export default function TroubleshootingPage({ params }: TroubleshootingPageRouteProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <TroubleshootingPageContent params={params} />
    </Suspense>
  );
}

async function TroubleshootingPageContent({ params }: TroubleshootingPageRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageProps = await buildTroubleshootingPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/betterthanyou/contestant245.gif',
          alt: '',
        }}
        color="#ad3e8c"
      >
        <Heading as="h1" size="lg">
          Script Troubleshooting Tool
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>
          Your itemdb userscripts are not working? Use this tool to help us figure out what the
          issue is!
        </Text>
      </HeaderCard>
      <TroubleshootingPageClient {...pageProps} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
