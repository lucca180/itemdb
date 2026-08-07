import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { buildTroubleshootingPageProps } from './buildTroubleshootingPageProps';
import { TroubleshootingPageClient } from './TroubleshootingPageClient';

const mainColor = '#ad3e8cc7';

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Troubleshooting Tool',
    pathname: '/tools/troubleshooting',
    noindex: true,
  });
}

export default function TroubleshootingPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <TroubleshootingPageContent />
    </Suspense>
  );
}

async function TroubleshootingPageContent() {
  const pageProps = await buildTroubleshootingPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
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
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
