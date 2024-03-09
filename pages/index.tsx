import {
  Box,
  Flex,
  Heading,
  Highlight,
  Link,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import logo from '../public/logo_white_compressed.svg';
import Image from 'next/image';
import ItemCard from '../components/Items/ItemCard';
import { ItemData, WP_Article } from '../types';
import BetaStatsCard from '../components/Beta/BetaStatsCard';
import axios from 'axios';
import { getLatestOwls } from './api/v1/items/owls';
import { ArticleCard } from '../components/Articles/ArticlesCard';
import { wp_getLatestPosts } from './api/wp/posts';
import NextLink from 'next/link';
import Color from 'color';
import { getTrendingItems } from './api/v1/beta/trending';
import { getHotestRestock } from './api/v1/beta/restock';
import { useTranslations } from 'next-intl';

type Props = {
  latestOwls: ItemData[];
  latestPosts: WP_Article[];
  trendingItems: ItemData[];
  hottestRestock: ItemData[];
};

const HomePage = (props: Props) => {
  const t = useTranslations('HomePage');
  const { latestOwls, latestPosts, hottestRestock } = props;
  const [latestItems, setItems] = useState<ItemData[] | null>(null);
  const [latestPrices, setPrices] = useState<ItemData[] | null>(null);
  const [trendingItems, setTrending] = useState<ItemData[] | null>(null);

  const color = Color('#4A5568');
  // const color = Color('#CB3F5D');
  const rgb = color.rgb().round().array();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const [itemRes, priceRes] = (await Promise.allSettled([
      axios.get('api/v1/items', {
        params: {
          limit: 16,
        },
      }),
      axios.get('api/v1/prices', {
        params: {
          limit: 16,
        },
      }),
    ])) as { status: 'fulfilled' | 'rejected'; value?: any }[];

    setItems(itemRes.value?.data || null);
    setPrices(priceRes.value?.data || null);
    setTrending(props.trendingItems || null);
  };

  return (
    <Layout
      SEO={{
        description: t('seo-description'),
      }}
    >
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
        <Heading size="sm" mt={4} lineHeight={1.5}>
          <Highlight
            query={t('open-source')}
            styles={{
              px: '2',
              py: '1',
              rounded: 'full',
              bg: 'gray.100',
            }}
          >
            {t('title')}
          </Highlight>{' '}
          <Link color={color.lightness(70).hex()} href="/faq">
            {t('why-us')}
          </Link>
        </Heading>
      </Box>
      <Flex mt={8} gap={4} flexFlow="column">
        <Heading size="md">{t('latest-prices')}</Heading>
        <Flex flexWrap="wrap" gap={4} justifyContent="center">
          {latestPrices !== null &&
            latestPrices.map((item) => <ItemCard item={item} key={item.internal_id} />)}
          {!latestPrices && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
        </Flex>
        <Stack direction={{ base: 'column', lg: 'row' }}>
          <Flex gap={4} flexFlow="column" flex="1">
            <Heading size="md" textAlign={{ base: 'left', lg: 'center' }}>
              {t('latest-discoveries')}
            </Heading>
            <Flex flexWrap="wrap" gap={4} justifyContent="center" h="100%">
              {latestItems &&
                latestItems.map((item) => <ItemCard item={item} key={item.internal_id} />)}
              {!latestItems && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
            </Flex>
          </Flex>
          <Flex gap={4} flexFlow="column" flex="1">
            <Tabs flex={1} colorScheme="gray" variant={'line'}>
              <TabList>
                {props.trendingItems.length > 0 && <Tab>{t('trending-items')}</Tab>}
                {!latestOwls || (!!latestOwls.length && <Tab>{t('latest-owls')}</Tab>)}
                <Tab>
                  {t('hottest-restock-period')} {t('hottest-restock')}
                </Tab>
              </TabList>
              <TabPanels>
                {props.trendingItems.length > 0 && (
                  <TabPanel px={0}>
                    <Flex flexWrap="wrap" gap={4} justifyContent="center">
                      {trendingItems !== null &&
                        trendingItems.map((item) => (
                          <ItemCard item={item} key={item.internal_id} />
                        ))}
                      {!trendingItems && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
                    </Flex>
                  </TabPanel>
                )}
                {latestOwls.length && (
                  <TabPanel px={0}>
                    <Flex flexWrap="wrap" gap={4} justifyContent="center" h="100%">
                      {latestOwls &&
                        latestOwls.map((item) => <ItemCard item={item} key={item.internal_id} />)}
                      {!latestOwls && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
                    </Flex>
                  </TabPanel>
                )}
                <TabPanel px={0}>
                  <Flex flexWrap="wrap" gap={4} justifyContent="center">
                    {hottestRestock &&
                      hottestRestock.map((item) => <ItemCard item={item} key={item.internal_id} />)}
                    {!hottestRestock && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Flex>
        </Stack>
        <Stack direction={{ base: 'column', lg: 'row' }} mt={2} gap={{ base: 8, lg: 3 }}>
          <Flex flexFlow="column" flex={1} alignItems="center" h="100%">
            <Heading size="md">{t('stats')}</Heading>
            <BetaStatsCard />
          </Flex>
          <Flex flex={1} flexFlow={'column'}>
            <Heading size="md" textAlign="center" mb={5}>
              <Link as={NextLink} href="/articles">
                {t('latest-articles')}
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
    </Layout>
  );
};

export default HomePage;

export async function getStaticProps(context: any) {
  const [latestOwls, latestPosts, trendingItems, hottestRestock] = await Promise.all([
    getLatestOwls(16).catch(() => []),
    wp_getLatestPosts(5).catch((e) => {
      console.error(e);
      return [];
    }),
    getTrendingItems(16).catch(() => []),
    getHotestRestock(16, 15).catch(() => []),
  ]);

  return {
    props: {
      latestOwls,
      latestPosts,
      trendingItems,
      hottestRestock,
      messages: (await import(`../translation/${context.locale}.json`)).default,
    },
    revalidate: 60, // In seconds
  };
}
