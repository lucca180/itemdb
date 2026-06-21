import { Suspense } from 'react';
import { Flex, Heading, Separator, Skeleton, Text } from '@chakra-ui/react';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getTranslations } from 'next-intl/server';
import { loadOfficialAllLists, loadOfficialTrendingLists } from './loadOfficialLists';
import {
  OfficialAllListsSlot,
  OfficialListsPageClient,
  OfficialTrendingListsSlot,
} from './OfficialListsPageClient';

type OfficialListsHeaderProps = {
  locale: string;
};

async function OfficialListsHeader({ locale }: OfficialListsHeaderProps) {
  const t = await getTranslations();

  return (
    <HeaderCard
      image={{
        src: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
        alt: 'grundo warehouse thumbnail',
      }}
      color="#4962ec"
      breadcrumb={
        <BreadcrumbsView
          locale={locale}
          useAppDir
          breadcrumbList={[
            {
              position: 1,
              name: t('Layout.home'),
              item: '/',
            },
            {
              position: 2,
              name: t('General.official-lists'),
              item: '/lists/official',
            },
          ]}
        />
      }
    >
      <Heading as="h1" size="lg">
        {t('General.official-lists')}
      </Heading>
      <Text fontSize={{ base: 'sm', md: undefined }}>
        {t.rich('Lists.officialList-subheader', {
          br: () => <br />,
        })}
      </Text>
    </HeaderCard>
  );
}

export function OfficialTrendingListsSkeleton() {
  return (
    <Flex flexFlow="column" gap={3} bg="blackAlpha.500" p={4} borderRadius="md">
      <Skeleton h="28px" w="160px" />
      <Flex gap={3} justifyContent="center" flexWrap="wrap" py={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} h="220px" w="220px" borderRadius="md" />
        ))}
      </Flex>
    </Flex>
  );
}

export function OfficialAllListsSkeleton() {
  return (
    <Flex flexFlow="column" gap={3} bg="blackAlpha.500" p={4} borderRadius="md">
      <Skeleton h="28px" w="180px" />
      <Flex gap={3} justifyContent="center" flexWrap="wrap" py={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} h="220px" w="220px" borderRadius="md" />
        ))}
      </Flex>
    </Flex>
  );
}

async function OfficialTrendingLists({ canEdit }: { canEdit: boolean }) {
  const trendingLists = await loadOfficialTrendingLists();
  return <OfficialTrendingListsSlot trendingLists={trendingLists} canEdit={canEdit} />;
}

async function OfficialAllLists({ canEdit }: { canEdit: boolean }) {
  const { allLists, categories } = await loadOfficialAllLists();
  return <OfficialAllListsSlot allLists={allLists} categories={categories} canEdit={canEdit} />;
}

type OfficialListsPageBodyProps = {
  locale: string;
  initialCat?: string;
  canEdit: boolean;
};

export async function OfficialListsPageBody({
  locale,
  initialCat,
  canEdit,
}: OfficialListsPageBodyProps) {
  return (
    <>
      <OfficialListsHeader locale={locale} />
      <Separator />
      <OfficialListsPageClient initialCat={initialCat}>
        <Suspense fallback={<OfficialTrendingListsSkeleton />}>
          <OfficialTrendingLists canEdit={canEdit} />
        </Suspense>
        <Suspense fallback={<OfficialAllListsSkeleton />}>
          <OfficialAllLists canEdit={canEdit} />
        </Suspense>
      </OfficialListsPageClient>
    </>
  );
}
