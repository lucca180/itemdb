import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Center, Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { listOpenableCandidates, OPENABLE_REVIEW_DAYS_STEP } from '@services/OpenableReviewService';
import { OpenableReviewClient } from './OpenableReviewClient';

/**
 * Admin queue of items that got community opening reports but are not marked openable.
 * Server component: loads the first window and hands it to the review client.
 */
const mainColor = '#8f7a55c7';

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Openable Review',
    description: 'Admin tool for reviewing items with opening reports that are not openable.',
    pathname: '/admin/openable-review',
    noindex: true,
    nofollow: true,
  });
}

export default function OpenableReviewPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <OpenableReviewPageContent />
    </Suspense>
  );
}

async function OpenableReviewPageContent() {
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
          <HeaderCard color="#8f7a55">
            <Heading as="h1" size="lg">
              Openable Review
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Items not marked as openable (False or Unknown) that received community opening
              reports recently, newest items first. By default only items whose drops would show up
              once marked openable are listed.
            </Text>
          </HeaderCard>
          <OpenableReviewQueueContent />
        </>
      )}
    </>
  );
}

async function OpenableReviewQueueContent() {
  const initial = await listOpenableCandidates({
    days: OPENABLE_REVIEW_DAYS_STEP,
    onlyWouldShowDrops: true,
  });

  return <OpenableReviewClient initial={initial} daysStep={OPENABLE_REVIEW_DAYS_STEP} />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
