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
import { BulkPriceContextClient } from './BulkPriceContextClient';

const mainColor = '#557f8fc7';

type BulkPriceContextPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BulkPriceContextPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return getStaticAppPageProps(locale, {
    title: 'Bulk Price Context',
    description: 'Admin tool for adding price context to item prices in bulk.',
    pathname: '/admin/bulk-price-context',
    noindex: true,
    nofollow: true,
  }).metadata;
}

export default function BulkPriceContextPage({ params }: BulkPriceContextPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <BulkPriceContextPageContent params={params} />
    </Suspense>
  );
}

async function BulkPriceContextPageContent({ params }: BulkPriceContextPageProps) {
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
            color="#557f8f"
          >
            <Heading as="h1" size="lg">
              Bulk Price Context
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Add context to the first price for each selected item after a chosen date.
            </Text>
          </HeaderCard>
          <BulkPriceContextClient />
        </>
      )}
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
