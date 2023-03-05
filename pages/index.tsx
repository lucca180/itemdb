import { Box, Center, Flex, Heading, Highlight, Link } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import logo from '../public/logo_white.svg';
import Image from 'next/image';
import ItemCard from '../components/Items/ItemCard';
import { ItemData } from '../types';
import BetaStatsCard from '../components/Beta/BetaStatsCard';

const isProd = process.env.NODE_ENV === 'production';

const HomePage = () => {
  const [items, setItems] = useState<ItemData[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const res = await fetch('/api/v1/items/');
    const itemData = (await res.json()) as ItemData[];

    setItems(itemData);
  };

  if (!isProd)
    return (
      <Center h="100vh" flexFlow="column">
        <Image src={logo} alt="itemdb logo" width={300} quality="100" />
        <BetaStatsCard />
      </Center>
    );

  return (
    <Layout>
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
          <Link color="purple.300" href="#">
            Why us?
          </Link>
        </Heading>
      </Box>
      <Box mt={8}>
        <Heading size="md">Latest Discoveries</Heading>
        <Flex mt={4} flexWrap="wrap" gap={4}>
          {items.map((item) => (
            <ItemCard item={item} key={item.internal_id} />
          ))}
        </Flex>
      </Box>
    </Layout>
  );
};

export default HomePage;
