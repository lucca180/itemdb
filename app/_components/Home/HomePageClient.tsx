'use client';

import { Fragment, type ReactNode } from 'react';
import { Flex, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { UserList } from '@types';
import { TVWHomeCard } from '@components/Card/EventCard';

export type HomePageClientProps = {
  hero: ReactNode;
  latestPricesSection: ReactNode;
  newItemsSection: ReactNode;
  latestArticlesSection: ReactNode;
  statsSection: ReactNode;
  latestItemsCard: ReactNode;
  trendingItemsCard: ReactNode;
  featuredListsCard: ReactNode;
  latestNcMallCard: ReactNode;
  leavingNcMallCard: ReactNode;
  latestWearableCard: ReactNode;
  eventLists: UserList[];
};

export function HomePageClient(props: HomePageClientProps) {
  const t = useTranslations();

  const {
    hero,
    latestPricesSection,
    newItemsSection,
    latestArticlesSection,
    statsSection,
    latestItemsCard,
    latestNcMallCard,
    trendingItemsCard,
    featuredListsCard,
    leavingNcMallCard,
    latestWearableCard,
    eventLists,
  } = props;

  return (
    <>
      {hero}
      <Flex mt={8} gap={8} flexFlow="column">
        {latestPricesSection}
        {eventLists?.length > 0 && <TVWHomeCard lists={eventLists} />}
        {newItemsSection}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 4, xl: 8 }} justifyItems="center">
          <Fragment key="latest-items-card">{latestItemsCard}</Fragment>
          <Fragment key="trending-items-card">{trendingItemsCard}</Fragment>
          <Fragment key="latest-nc-mall-card">{latestNcMallCard}</Fragment>
        </SimpleGrid>
        {featuredListsCard}
        <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 4, xl: 8 }}>
          {leavingNcMallCard}
          {latestWearableCard}
        </Stack>
        <Stack direction={{ base: 'column', lg: 'row' }} mt={2} gap={{ base: 8, lg: 3 }}>
          <Flex flexFlow="column" flex={1} alignItems="center">
            <Heading size="md" mb={{ base: 5, lg: 0 }}>
              {t('HomePage.stats')}
            </Heading>
            {statsSection}
          </Flex>
          {latestArticlesSection}
        </Stack>
      </Flex>
    </>
  );
}
