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
  Link,
} from '@chakra-ui/react';
import Color from 'color';
import { useEffect, useState, Fragment } from 'react';
import ShopCard from '../../components/Hubs/Restock/ShopCard';
import Layout from '../../components/Layout';
import { restockShopInfo, getDateNST } from '../../utils/utils';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

const allCats = [
  ...new Set(
    Object.values(restockShopInfo)
      .map((shop) => shop.category)
      .flat()
  ),
].sort((a, b) => a.localeCompare(b));

const color = Color('#A5DAE9').rgb().array();

const RestockHub = () => {
  const t = useTranslations();
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selDiff, setSelDiff] = useState<string[]>([]);
  const [specialDay, setSpecialDay] = useState('');

  useEffect(() => {
    const todayNST = getDateNST();

    if (todayNST.getDate() === 3) setSpecialDay('hpd');
    else if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) setSpecialDay('tyrannia');

    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) setSpecialDay('usukicon');

    if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) setSpecialDay('festival');

    if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) setSpecialDay('halloween');
  }, []);

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
        title: t('Restock.neopets-restock-helper'),
        description: t('Restock.restock-description'),
        themeColor: '#A5DAE9',
      }}
      mainColor="rgba(165, 218, 233, 0.4)"
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
        <Heading as="h1">{t('Restock.restock-hub')}</Heading>
        <Text>
          {t.rich('Restock.call-to-action', {
            b: (children) => <b>{children}</b>,
          })}
        </Text>
        <Text fontSize={'sm'}>
          {t.rich('Restock.dashboard-cta', {
            Link: (chunk) => (
              <Link as={NextLink} href="/restock/dashboard" color="blue.200">
                {chunk}
              </Link>
            ),
          })}
        </Text>
        {specialDay === 'hpd' && (
          <Tag colorScheme={'green'}>{t('Restock.half-price-day-all-shops-with-50-off')}</Tag>
        )}
        {specialDay === 'tyrannia' && (
          <Tag colorScheme={'orange'}>{t('Restock.tyrannian-hub')}</Tag>
        )}
        {specialDay === 'usukicon' && <Tag colorScheme={'pink'}>{t('Restock.hub-usuki-day')}</Tag>}
        {specialDay === 'festival' && (
          <Tag colorScheme={'purple'}>{t('Restock.faerie-festival-hub')}</Tag>
        )}
        {specialDay === 'halloween' && (
          <Tag colorScheme={'orange'}>{t('Restock.halloween-hub')}</Tag>
        )}
      </Center>
      <Divider />
      <HStack my={3} justifyContent="space-between" flexWrap={'wrap'}>
        <HStack flexWrap={'wrap'}>
          <Text fontSize={'sm'}>{t('ItemPage.categories')}:</Text>
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
          <Text fontSize={'sm'}>{t('Restock.difficulty')}:</Text>
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
            <Fragment key={cat}>
              <Heading as="h2" size="lg">
                {cat}
              </Heading>
              <Flex flexFlow="row" flexWrap="wrap" gap={3} justifyContent={'center'}>
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </Flex>
            </Fragment>
          );
        })}
      </Flex>
    </Layout>
  );
};

export default RestockHub;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
  };
}
