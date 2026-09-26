import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Center, Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { listPendingSuggestions } from '@services/list/listSuggestions';
import { ListSuggestionsDashboardClient } from './ListSuggestionsDashboardClient';

/**
 * Admin queue of "missing item" suggestions for official lists.
 * Server component: loads the pending suggestions and hands them to the dashboard client.
 */
const mainColor = '#557f8fc7';

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Official List Suggestions',
    description: 'Admin tool for reviewing missing item suggestions on official lists.',
    pathname: '/admin/list-suggestions',
    noindex: true,
    nofollow: true,
  });
}

export default function ListSuggestionsPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ListSuggestionsPageContent />
    </Suspense>
  );
}

async function ListSuggestionsPageContent() {
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
              Official List Suggestions
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Items users think are missing from official lists, grouped by list. Approving adds the
              item to the list; rejecting just dismisses the requests. Items already in the list are
              hidden automatically.
            </Text>
          </HeaderCard>
          <ListSuggestionsQueueContent />
        </>
      )}
    </>
  );
}

async function ListSuggestionsQueueContent() {
  const groups = await listPendingSuggestions();

  return <ListSuggestionsDashboardClient groups={groups} />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
