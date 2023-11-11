import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  Image,
  Text,
  HStack,
  Button,
  Tag,
} from '@chakra-ui/react';
import Color from 'color';
import { useEffect, useState } from 'react';
import ShopCard from '../../components/Hubs/Restock/ShopCard';
import Layout from '../../components/Layout';
import { restockShopInfo } from '../../utils/utils';

const RestockHub = () => {
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selDiff, setSelDiff] = useState<string[]>([]);
  const [specialDay, setSpecialDay] = useState('');

  useEffect(() => {
    const todayNST = new Date();

    if (todayNST.getDate() === 3) setSpecialDay('hpd');
    else if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) setSpecialDay('tyrannia');

    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) setSpecialDay('usukicon');

    if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) setSpecialDay('festival');

    if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) setSpecialDay('halloween');
  }, []);

  const color = Color('#A5DAE9').rgb().array();
  const allCats = [
    ...new Set(
      Object.values(restockShopInfo)
        .map((shop) => shop.category)
        .flat()
    ),
  ].sort((a, b) => a.localeCompare(b));

  const handleCat = (cat: string) => {
    if (selCats.includes(cat)) {
      setSelCats(selCats.filter((c) => c !== cat));
    } else {
      setSelCats([...selCats, cat]);
    }
  };

  const handleDiff = (diff: string) => {
    if (selDiff.includes(diff)) {
      setSelDiff(selDiff.filter((c) => c !== diff));
    } else {
      setSelDiff([...selDiff, diff]);
    }
  };

  return (
    <Layout
      SEO={{
        title: `Neopets Restock Helper`,
        description: `Find the most profitable items to buy from each shop in Neopia and earn a lot of neopoints!`,
        themeColor: '#A5DAE9',
      }}
    >
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Center my={6} flexFlow="column" gap={2}>
        <Image
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_limited.png"
          alt="Restock Hub thumbnail"
          borderRadius="md"
          boxShadow={'md'}
        />
        <Heading as="h1">Restock Hub</Heading>
        <Text>
          Find the most profitable items to buy from <b>each shop</b> in Neopia!
        </Text>
        {specialDay === 'hpd' && (
          <Tag colorScheme={'green'}>Half Price Day - All Shops with 50% off</Tag>
        )}
        {specialDay === 'tyrannia' && (
          <Tag colorScheme={'orange'}>
            Tyrannian Victory Day - All Tyrannian Shops with 80% off (except Ugga Shinies)
          </Tag>
        )}
        {specialDay === 'usukicon' && (
          <Tag colorScheme={'pink'}>Usuki Day - Usukiland with 66.6% off</Tag>
        )}
        {specialDay === 'festival' && (
          <Tag colorScheme={'purple'}>
            Faerie Festival - Faerieland Shops with 50% off (except Faerie Furniture and Faerie
            Weapon)
          </Tag>
        )}
        {specialDay === 'halloween' && (
          <Tag colorScheme={'orange'}>Halloween - Haunted Woods Shops with 50% off</Tag>
        )}
      </Center>
      <Divider />
      <HStack my={3} justifyContent="space-between" flexWrap={'wrap'}>
        <HStack flexWrap={'wrap'}>
          <Text fontSize={'sm'}>Categories:</Text>
          {allCats.map((cat) => (
            <Button
              size="sm"
              key={cat}
              colorScheme={selCats.includes(cat) ? 'cyan' : undefined}
              onClick={() => handleCat(cat)}
            >
              {cat}
            </Button>
          ))}
        </HStack>
        <HStack flexWrap="wrap">
          <Text fontSize={'sm'}>Difficulty:</Text>
          {['Beginner', 'Medium', 'Advanced'].map((diff) => (
            <Button
              size="sm"
              key={diff}
              colorScheme={
                selDiff.includes(diff)
                  ? diff === 'Beginner'
                    ? 'green'
                    : diff === 'Advanced'
                    ? 'red'
                    : 'cyan'
                  : undefined
              }
              onClick={() => handleDiff(diff)}
            >
              {diff === 'Medium' ? 'Normal' : diff}
            </Button>
          ))}
        </HStack>
      </HStack>
      <Flex flexFlow={'column'} flexWrap="wrap" gap={5} justifyContent="center">
        {(selCats.length > 0 ? selCats : allCats).map((cat) => {
          const shops = Object.values(restockShopInfo).filter(
            (x) =>
              (selDiff.length > 0 ? selDiff.includes(x.difficulty) : true) && x.category === cat
          );
          if (shops.length === 0) return null;
          return (
            <>
              <Heading as="h2" size="lg" key={cat}>
                {cat}
              </Heading>
              <Flex
                flexFlow="row"
                flexWrap="wrap"
                gap={5}
                justifyContent={{ base: 'center', xl: 'flex-start' }}
              >
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </Flex>
            </>
          );
        })}
      </Flex>
    </Layout>
  );
};

export default RestockHub;
