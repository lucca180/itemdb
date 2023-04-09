import { Box, Center, Flex, Heading, Highlight, Link } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import logo from '../public/logo_white.svg';
import Image from 'next/image';
import ItemCard from '../components/Items/ItemCard';
import { ItemData } from '../types';
import BetaStatsCard from '../components/Beta/BetaStatsCard';
import axios from 'axios';

// const isProd = process.env.NODE_ENV === 'production';

const HomePage = () => {
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

  // if (isProd)
  //   return (
  //     <Layout>
  //       <Center h="80vh" flexFlow="column">
  //         <Image src={logo} alt="itemdb logo" width={300} quality="100" />
  //         <BetaStatsCard />
  //       </Center>
  //     </Layout>
  //   );

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
        <Heading size="md">Latest Discoveries</Heading>
        <Flex flexWrap="wrap" gap={4} justifyContent="center">
          {latestItems.map((item) => (
            <ItemCard item={item} key={item.internal_id} />
          ))}
          {!isLoaded && [...Array(16)].map((_, i) => <ItemCard key={i} />)}
        </Flex>
        <Center flexFlow="column" mt={8}>
          <Heading size="md">Stats</Heading>
          {/* <Image src={logo} alt="itemdb logo" width={300} quality="100" /> */}
          <BetaStatsCard />
        </Center>
      </Flex>
    </Layout>
  );
};

export default HomePage;
