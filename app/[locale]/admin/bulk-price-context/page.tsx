import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Center, Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { BulkPriceContextClient } from './BulkPriceContextClient';

const mainColor = '#557f8fc7';

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Bulk Price Context',
    description: 'Admin tool for adding price context to item prices in bulk.',
    pathname: '/admin/bulk-price-context',
    noindex: true,
    nofollow: true,
  });
}

export default function BulkPriceContextPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <BulkPriceContextPageContent />
    </Suspense>
  );
}

async function BulkPriceContextPageContent() {
  const { user } = await getServerCurrentUser();

  return (
    <>
      <SetMainColor color={mainColor} />
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
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
