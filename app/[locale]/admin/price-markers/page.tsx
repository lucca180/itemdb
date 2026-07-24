import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Center, Heading, Text } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { setRequestLocale } from 'next-intl/server';
import { PriceMarkersClient } from './PriceMarkersClient';

const mainColor = '#8f5573c7';

type PriceMarkersPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PriceMarkersPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return getStaticAppPageProps(locale, {
    title: 'Manual Price Markers',
    description: 'Admin tool for adding manual price markers to item price history.',
    pathname: '/admin/price-markers',
    noindex: true,
    nofollow: true,
  }).metadata;
}

export default function PriceMarkersPage({ params }: PriceMarkersPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <PriceMarkersPageContent params={params} />
    </Suspense>
  );
}

async function PriceMarkersPageContent({ params }: PriceMarkersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await getServerCurrentUser();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      {!user?.isAdmin && (
        <Center minH="60vh" flexFlow="column" gap={3} textAlign="center">
          <Heading size="md">You are not authorized to access this page.</Heading>
          <Text color="gray.400">Admin access is required.</Text>
        </Center>
      )}
      {user?.isAdmin && (
        <>
          <HeaderCard
            image={{
              src: 'https://images.neopets.com/nt/ntimages/441_xweetok_agent.gif',
              alt: 'xweetok agent thumbnail',
            }}
            color="#8f5573"
          >
            <Heading as="h1" size="lg">
              Manual Price Markers
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Create manual markers (events, restocks, availability windows) that appear on the item
              price history table and chart.
            </Text>
          </HeaderCard>
          <PriceMarkersClient />
        </>
      )}
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
