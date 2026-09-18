import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Center, Heading, Text } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { listPendingInfoChecks } from '@app/api/admin/manual/manualCheckService';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { ManualCheckDashboardClient } from './ManualCheckDashboardClient';

const mainColor = '#8f5573c7';
const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return await getStaticAppMetadata({
    title: 'Manual Check Queue',
    description: 'Admin tool for triaging pending item merge-conflict submissions.',
    pathname: '/admin/manual-check',
    noindex: true,
    nofollow: true,
  });
}

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default function ManualCheckPage(props: Props) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ManualCheckPageContent {...props} />
    </Suspense>
  );
}

async function ManualCheckPageContent({ searchParams }: Props) {
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
            color="#8f5573"
          >
            <Heading as="h1" size="lg">
              Manual Check Queue
            </Heading>
            <Text fontSize={{ base: 'sm', md: undefined }}>
              Pending item submissions that couldn&apos;t be merged automatically, grouped by
              conflict type. Renames are backed by a real item_id match (higher confidence); re-arts
              only matched by name (double-check before approving).
            </Text>
          </HeaderCard>
          <ManualCheckQueueContent searchParams={searchParams} />
        </>
      )}
    </>
  );
}

async function ManualCheckQueueContent({ searchParams }: Pick<Props, 'searchParams'>) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { groups, total } = await listPendingInfoChecks({ page, pageSize: PAGE_SIZE });

  const dashboardGroups = (
    await Promise.all(
      groups.map(async (group) => {
        const item = await getItem(group.targetId);
        if (!item) return null;
        return { targetId: group.targetId, category: group.category, item, info: group.info };
      })
    )
  ).filter((g): g is NonNullable<typeof g> => g !== null);

  return (
    <ManualCheckDashboardClient
      groups={dashboardGroups}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
    />
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
