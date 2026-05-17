'use client';

import type { ReactNode } from 'react';
import { Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import type { ItemData, UserList } from '@types';
import { HomeCard } from '@components/Card/HomeCard';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { TVWHomeCard } from '@components/Card/EventCard';
import Image from '@components/Utils/Image';
import UserListCard from '@components/UserLists/ListCard';

export type HomePageClientProps = {
  hero: ReactNode;
  latestPricesSection: ReactNode;
  latestArticlesSection: ReactNode;
  statsSection: ReactNode;
  latestItems: ItemData[];
  latestWearable: ItemData[];
  trendingItems: ItemData[];
  latestNcMall: ItemData[];
  leavingNcMall: ItemData[];
  trendingLists: UserList[];
  eventLists: UserList[];
  newItemCount: {
    freeItems: number;
    paidItems: number;
  } | null;
};

const fetcher = <T,>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  axios.get<T>(url, config).then((res) => res.data);

export function HomePageClient(props: HomePageClientProps) {
  const t = useTranslations();

  const {
    hero,
    latestPricesSection,
    latestArticlesSection,
    statsSection,
    latestWearable,
    latestNcMall,
    trendingItems,
    leavingNcMall,
    trendingLists,
    newItemCount,
    eventLists,
  } = props;

  const { data: latestItems } = useSWR<ItemData[]>(
    '/api/v1/items?limit=20',
    (url) => fetcher(url),
    {
      fallbackData: props.latestItems,
    }
  );

  return (
    <>
      {hero}
      <Flex mt={8} gap={8} flexFlow="column">
        {latestPricesSection}
        {eventLists?.length > 0 && <TVWHomeCard lists={eventLists} />}
        {newItemCount && (
          <Flex gap={4} flexWrap="wrap" flexFlow={{ base: 'column', lg: 'row' }}>
            <HorizontalHomeCard
              color="#B794F4"
              bgOpacity="0.75"
              innerStyle={{ border: 0, py: 2 }}
              style={{ flex: '1' }}
            >
              <Flex alignItems="center">
                <Image
                  src={
                    newItemCount.paidItems > newItemCount.freeItems * 2
                      ? 'https://images.neopets.com/caption/sm_caption_1100.gif'
                      : 'https://images.neopets.com/nt/ntimages/332_nc_mall.gif'
                  }
                  alt="tax beast thumbnail"
                  width={100}
                  height={100}
                  quality={100}
                  borderRadius="md"
                />
                <Flex flexFlow="column" ml={3}>
                  <Text fontSize="lg" fontWeight="bold">
                    {t.rich('HomePage.new-paid-items', {
                      Highlight: (chunks) => (
                        <Text as="span" color="purple.700" bg="purple.200" px={1} borderRadius="md">
                          {chunks}
                        </Text>
                      ),
                      days: 7,
                    })}
                  </Text>
                  <Text fontSize="4xl" fontWeight="bold">
                    {newItemCount.paidItems}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.700">
                    {t('HomePage.new-paid-items-text')}
                  </Text>
                </Flex>
              </Flex>
            </HorizontalHomeCard>
            <HorizontalHomeCard
              color="#F6AD55"
              bgOpacity="0.75"
              innerStyle={{ border: 0, py: 2 }}
              style={{ flex: '1' }}
            >
              <Flex alignItems="center">
                <Image
                  src="https://images.neopets.com/nt/ntimages/475_money_tree.gif"
                  alt="money tree thumbnail"
                  width={100}
                  height={100}
                  quality={100}
                  borderRadius="md"
                />
                <Flex flexFlow="column" ml={3}>
                  <Text fontSize="lg" fontWeight="bold">
                    {t.rich('HomePage.new-free-items', {
                      Highlight: (chunks) => (
                        <Text as="span" color="orange.600" bg="orange.100" px={1} borderRadius="md">
                          {chunks}
                        </Text>
                      ),
                      days: 7,
                    })}
                  </Text>
                  <Text fontSize="4xl" fontWeight="bold">
                    {newItemCount.freeItems}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.800">
                    {t('HomePage.new-free-items-text')}
                  </Text>
                </Flex>
              </Flex>
            </HorizontalHomeCard>
          </Flex>
        )}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 4, xl: 8 }} justifyItems="center">
          {latestItems && (
            <HomeCard
              utm_content="latest-items"
              href="/search?s=&sortBy=added&sortDir=desc"
              color="#e7db7a"
              image="https://images.neopets.com/prehistoric/outskirts/fearslayer_9h4v3cfj.png"
              items={latestItems}
              title={t('HomePage.latest-discoveries')}
            />
          )}
          {trendingItems && (
            <HomeCard
              utm_content="trending-items"
              color="#AE445A"
              title={t('HomePage.trending-items')}
              image="https://images.neopets.com/themes/h5/common/communitycentral/images/icon-neoboards.png"
              items={trendingItems}
            />
          )}
          {latestNcMall && (
            <HomeCard
              utm_content="latest-nc-mall"
              color="#BED754"
              title={t('HomePage.new-in-nc-mall')}
              image="https://images.neopets.com/neggfest/y19/mall/nc.png"
              items={latestNcMall}
            />
          )}
        </SimpleGrid>
        <HorizontalHomeCard
          color="#4A5568"
          image="https://images.neopets.com/themes/h5/newyears/images/transferlog-icon.png"
          title={t('HomePage.featured-lists')}
          viewAllLink="/lists/official"
          utm_content="featured-lists"
        >
          <Flex flexWrap="wrap" gap={4} justifyContent="center">
            {trendingLists.map((list) => (
              <UserListCard key={list.internal_id} list={list} utm_content="featured-lists" />
            ))}
          </Flex>
        </HorizontalHomeCard>
        <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 4, xl: 8 }}>
          {leavingNcMall && (
            <HomeCard
              useItemCard
              href="/mall/leaving"
              utm_content="leaving-nc-mall"
              color="#CB9DF0"
              image="https://images.neopets.com/themes/h5/altadorcup/images/calendar-icon.png"
              items={leavingNcMall}
              title={t('HomePage.leaving-nc-mall')}
              h={70}
              w={70}
              perPage={9}
            />
          )}
          {latestWearable && (
            <HomeCard
              useItemCard
              utm_content="latest-wearable"
              href="/search?s=&sortBy=added&sortDir=desc&type[]=wearable&utm_content=latest-wearable"
              color="#59cde2"
              image="https://images.neopets.com/themes/h5/basic/images/customise-icon.svg"
              items={latestWearable}
              title={t('HomePage.new-clothes')}
              w={70}
              h={70}
              perPage={9}
            />
          )}
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
