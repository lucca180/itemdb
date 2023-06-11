import { Box, Center, Flex, Heading, Highlight, Link, Stack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import logo from '../public/logo_white.svg';
import Image from 'next/image';
import ItemCard from '../components/Items/ItemCard';
import { ItemData } from '../types';
import BetaStatsCard from '../components/Beta/BetaStatsCard';
import axios from 'axios';
import { getLatestOwls } from './api/v1/items/owls';

// const isProd = process.env.NODE_ENV === 'production';
type Props = {
  latestOwls: ItemData[];
};

const HomePage = (props: Props) => {
  const { latestOwls } = props;
  const [latestItems, setItems] = useState<ItemData[]>([]);
  const [latestPrices, setPrices] = useState<ItemData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const [itemRes, priceRes] = await Promise.all([
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
    ]);
    setIsLoaded(true);
    setItems(itemRes.data);
    setPrices(priceRes.data);
  };

  return (
    <Layout
      SEO={{
        description:
          'Find all the data about Neopets items such as the most updated prices, wearable previews, restock history, color search, and more! Create your item lists easily and share around Neopia!',
      }}
    >
      <Box textAlign="center" display="flex" flexFlow="column" alignItems="center" mt="50px">
        <Image src={logo} alt="itemdb logo" width={500} quality="100" />
        <Heading size="sm" mt={4}>
          <Highlight
            query="open source"
            styles={{
              px: '2',
              py: '1',
              rounded: 'full',
              bg: 'gray.100',
            }}
          >
            Your open source of Neopets item info.
          </Highlight>{' '}
          <Link color="cyan.300" href="/faq">
            Why us?
          </Link>
        </Heading>
      </Box>
      <Flex mt={8} gap={4} flexFlow="column">
        <Heading size="md">Latest Prices</Heading>
        <Flex flexWrap="wrap" gap={4} justifyContent="center">
          {latestPrices.map((item) => (
            <ItemCard item={item} key={item.internal_id} />
          ))}
          {!isLoaded && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
        </Flex>
        <Stack direction={{ base: 'column', lg: 'row' }}>
          <Flex gap={4} flexFlow="column" flex="1">
            <Heading size="md" textAlign={{ base: 'left', lg: 'center' }}>
              Latest Discoveries
            </Heading>
            <Flex flexWrap="wrap" gap={4} justifyContent="center" h="100%">
              {latestItems.map((item) => (
                <ItemCard item={item} key={item.internal_id} />
              ))}
              {!isLoaded && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
            </Flex>
          </Flex>
          <Flex gap={4} flexFlow="column" flex="1">
            <Heading size="md" textAlign={{ base: 'left', lg: 'center' }}>
              Latest Owls
            </Heading>
            <Flex flexWrap="wrap" gap={4} justifyContent="center" h="100%">
              {isLoaded &&
                latestOwls.map((item) => <ItemCard item={item} key={item.internal_id} />)}
              {!isLoaded && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
            </Flex>
          </Flex>
        </Stack>
        <Center flexFlow="column" mt={8}>
          <Heading size="md">Stats</Heading>
          <BetaStatsCard />
        </Center>
      </Flex>
    </Layout>
  );
};

export default HomePage;

export async function getStaticProps() {
  const latestOwls = await getLatestOwls(16);
  return {
    props: {
      latestOwls,
    },
    revalidate: 60, // In seconds
  };
}
