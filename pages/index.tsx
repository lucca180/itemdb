import { Box, Flex, Heading, Highlight, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import React, { ReactElement } from 'react';
import Layout from '../components/Layout';
import logo from '../public/logo_white_compressed.webp';
import Image from 'next/image';
import ItemCard from '../components/Items/ItemCard';
import { ItemData, UserList, WP_Article } from '../types';
import BetaStatsCard from '../components/Beta/BetaStatsCard';
import axios, { AxiosRequestConfig } from 'axios';
import { getLatestOwls } from './api/v1/items/owls';
import { ArticleCard } from '../components/Articles/ArticlesCard';
import { wp_getLatestPosts } from './api/wp/posts';
import NextLink from 'next/link';
import Color from 'color';
import { getTrendingItems, getTrendingLists } from './api/v1/beta/trending';
// import { getHotestRestock } from './api/v1/beta/restock';
import { createTranslator, useFormatter, useTranslations } from 'next-intl';
import { getNCMallItemsData } from './api/v1/ncmall';
import { getLatestItems } from './api/v1/items';
import { getLatestPricedItems } from './api/v1/prices';
import { NextPageWithLayout } from './_app';
import { HomeCard } from '../components/Card/HomeCard';
import UserListCard from '../components/UserLists/ListCard';
import { HorizontalHomeCard } from '../components/Card/HorizontalHomeCard';
import useSWR from 'swr';
import { loadTranslation } from '@utils/load-translation';

type LatestPricesRes = {
  count: number | null;
  items: ItemData[];
};

type Props = {
  latestItems: ItemData[];
  latestPrices: LatestPricesRes;
  latestOwls: ItemData[];
  latestPosts: WP_Article[];
  trendingItems: ItemData[];
  latestNcMall: ItemData[];
  leavingNcMall: ItemData[];
  trendingLists: UserList[];
  messages: any;
  locale: string;
};

const color = Color('#4A5568');
const rgb = color.rgb().round().array();

function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  return axios.get(url, config).then((res) => res.data);
}
const HomePage: NextPageWithLayout<Props> = (props: Props) => {
  const t = useTranslations();
  const formatter = useFormatter();

  const { latestOwls, latestPosts, latestNcMall, trendingItems, leavingNcMall, trendingLists } =
    props;

  const { data: latestItems } = useSWR<ItemData[]>(`api/v1/items?limit=20`, (url) => fetcher(url), {
    fallbackData: props.latestItems,
  });

  const { data: latestPrices } = useSWR<LatestPricesRes>(
    `api/v1/prices?limit=16&count=true`,
    (url) => fetcher(url),
    { fallbackData: props.latestPrices }
  );

  return (
    <>
      <Box textAlign="center" display="flex" flexFlow="column" alignItems="center" mt="50px">
        <Box
          position="absolute"
          h="40vh"
          left="0"
          width="100%"
          mt="-50px"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
          zIndex={-1}
        />
        <Image src={logo} alt="itemdb logo" width={500} quality="100" priority />
        <Heading size="sm" as="h1" mt={4} lineHeight={1.5}>
          <Highlight
            query={t('HomePage.open-source')}
            styles={{
              px: '2',
              py: '1',
              rounded: 'full',
              bg: 'gray.100',
            }}
          >
            {t('HomePage.title')}
          </Highlight>{' '}
          <Link color={color.lightness(70).hex()} href="/faq">
            {t('HomePage.is-it-safe')}
          </Link>
        </Heading>
      </Box>
      <Flex mt={8} gap={8} flexFlow="column">
        <HorizontalHomeCard
          color="#2e333b"
          h={70}
          w={70}
          image="https://images.neopets.com/quests/images/neopoint-bag.png"
          title={t('HomePage.latest-prices')}
        >
          <Flex flexWrap="wrap" gap={4} justifyContent="center">
            {latestPrices &&
              latestPrices.items.map((item) => (
                <ItemCard item={item} key={item.internal_id} utm_content="latest-prices" />
              ))}
            {!latestPrices && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
          </Flex>
          {latestPrices?.count && (
            <Text textAlign={'right'} mt={4} fontSize={'xs'} color={'whiteAlpha.400'}>
              {t('HomePage.x-prices-updated-last-y', {
                count: formatter.number(latestPrices.count),
                time: '48h',
              })}
            </Text>
          )}
        </HorizontalHomeCard>
        <SimpleGrid
          columns={{ base: 1, lg: 3 }}
          spacing={{ base: 4, xl: 8 }}
          justifyItems={'center'}
        >
          {latestItems && (
            <HomeCard
              utm_content="latest-items"
              href="/search?s=&sortBy=added&sortDir=desc&utm_content=latest-items"
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
          viewAllLink="/lists/official?utm_content=featured-lists"
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
            />
          )}
          {latestOwls && (
            <HomeCard
              useItemCard
              utm_content="latest-owls"
              href="/owls"
              color="#789DBC"
              image="https://images.neopets.com/neopies/y25/images/nominees/GiftBoxMysteryCapsule_y20tmnsll0/04.png"
              items={latestOwls}
              title={t('HomePage.latest-owls')}
              linkText={t('General.learn-more')}
              w={70}
              h={70}
            />
          )}
        </Stack>
        <Stack direction={{ base: 'column', lg: 'row' }} mt={2} gap={{ base: 8, lg: 3 }}>
          <Flex flexFlow="column" flex={1} alignItems="center">
            <Heading size="md" mb={{ base: 5, lg: 0 }}>
              {t('HomePage.stats')}
            </Heading>
            <BetaStatsCard />
          </Flex>
          <Flex flex={1} flexFlow={'column'}>
            <Heading size="md" textAlign="center" mb={5}>
              <Link as={NextLink} href="/articles">
                {t('HomePage.latest-articles')}
              </Link>
            </Heading>
            <Flex flexFlow={'column'} gap={2}>
              {latestPosts.map((post) => (
                <ArticleCard key={post.id} article={post} />
              ))}
            </Flex>
          </Flex>
        </Stack>
      </Flex>
    </>
  );
};

export default HomePage;

export async function getStaticProps(context: any): Promise<{ props: Props; revalidate: number }> {
  const [
    latestItems,
    latestOwls,
    latestPosts,
    trendingItems,
    latestNcMall,
    latestPrices,
    leavingNcMall,
    trendingLists,
  ] = await Promise.all([
    getLatestItems(20, true).catch(() => []),
    getLatestOwls(18).catch(() => []),
    wp_getLatestPosts(5).catch((e) => {
      console.error(e);
      return [];
    }),
    getTrendingItems(20).catch(() => []),
    getNCMallItemsData(20).catch(() => []),
    getLatestPricedItems(16, true).catch(() => ({
      items: [],
      count: null,
    })) as Promise<LatestPricesRes>,
    getNCMallItemsData(18, true).catch(() => []),
    getTrendingLists(3).catch(() => []),
  ]);

  return {
    props: {
      latestItems,
      latestOwls,
      latestPosts,
      trendingItems,
      latestNcMall,
      latestPrices,
      leavingNcMall,
      trendingLists,
      messages: await loadTranslation(context.locale, 'index'),
      locale: context.locale,
    },
    revalidate: 180, // In seconds
  };
}

HomePage.getLayout = function getLayout(page: ReactElement, props: Props) {
  const t = createTranslator({
    messages: props.messages,
    locale: props.locale,
  });
  return (
    <Layout
      mainColor={color.alpha(0.9).hexa()}
      SEO={{
        description: t('HomePage.seo-description'),
      }}
    >
      {page}
    </Layout>
  );
};
