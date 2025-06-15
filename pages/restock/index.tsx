import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  Text,
  HStack,
  Button,
  Tag,
  Link,
} from '@chakra-ui/react';
import Color from 'color';
import { useState, Fragment, ReactElement, useMemo } from 'react';
import ShopCard from '../../components/Hubs/Restock/ShopCard';
import Layout from '../../components/Layout';
import { restockShopInfo, getDateNST } from '../../utils/utils';
import NextLink from 'next/link';
import { createTranslator, useTranslations } from 'next-intl';
import { NextPageWithLayout } from '../_app';
import Image from '../../components/Utils/Image';
import { getTrendingShops } from '../api/v1/beta/trending';
import { ShopInfo } from '../../types';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';

const allCats = [
  ...new Set(
    Object.values(restockShopInfo)
      .map((shop) => shop.category)
      .flat()
  ),
].sort((a, b) => a.localeCompare(b));

const color = Color('#A5DAE9').rgb().array();

type RestockHubProps = {
  trendingShops: ShopInfo[];
};

const RestockHub: NextPageWithLayout<any> = (props: RestockHubProps) => {
  const t = useTranslations();
  const { trendingShops } = props;
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selDiff, setSelDiff] = useState<string[]>([]);

  const todayNST = getDateNST();
  const todayDate = todayNST.getDate();

  const specialDay = useMemo(() => {
    if (todayNST.getDate() === 3) return 'hpd';
    if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) return 'tyrannia';
    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) return 'usukicon';
    if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) return 'festival';
    if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) return 'halloween';
    return '';
  }, [todayDate]);

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
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]},${color[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Box mt={2}>
        <Breadcrumbs
          breadcrumbList={[
            {
              position: 1,
              name: t('Layout.home'),
              item: '/',
            },
            {
              position: 2,
              name: t('Restock.restock-hub'),
              item: '/restock',
            },
          ]}
        />
      </Box>
      <Center my={4} flexFlow="column" gap={2} textAlign={'center'}>
        <Image
          priority
          quality={100}
          width={600}
          height={200}
          w={'100%'}
          maxW={'600px'}
          h="auto"
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
      <Flex flexFlow={'column'} flexWrap="wrap" gap={5} justifyContent="center" mb={10}>
        {selCats.length === 0 && selDiff.length === 0 && (
          <>
            <Heading as="h2" size="lg">
              {t('Restock.trending-shops')}
            </Heading>
            <Flex flexFlow="row" flexWrap="wrap" gap={3} justifyContent={'center'}>
              {trendingShops.map((shop) => (
                <ShopCard key={shop.id + '_trending'} shop={shop} />
              ))}
            </Flex>
          </>
        )}
        {(selCats.length > 0 ? selCats : allCats).map((cat) => {
          const shops = Object.values(restockShopInfo).filter(
            (x) =>
              (selDiff.length > 0 ? selDiff.includes(x.difficulty) : true) &&
              x.category === cat &&
              Number(x.id) > 0
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
      <Divider mt={5} />
      <Flex flexFlow="column" gap={3} justifyContent={'center'}>
        <Heading size={'md'} as="h3" mt={5}>
          {t('Restock.faq-1')}
        </Heading>
        <Text color="whiteAlpha.700">
          {t('Restock.faq-1-text')}
          <br />
          <br />
          {t('Restock.faq-1-text-2')}
        </Text>
        <Heading size={'md'} as="h3" mt={5}>
          {t('Restock.faq-2')}
        </Heading>
        <Text color="whiteAlpha.700">{t('Restock.faq-2-text')}</Text>
        <Heading size={'md'} as="h3" mt={5}>
          {t('Restock.faq-3')}
        </Heading>
        <Text color="whiteAlpha.700">
          {t('Restock.faq-3-text')}
          <br />
          <br />
          {t('Restock.faq-3-text-2')}
        </Text>
        <Heading size={'md'} as="h3" mt={5}>
          {t('Restock.faq-4')}
        </Heading>
        <Text color="whiteAlpha.700">{t('Restock.faq-4-text')}</Text>
      </Flex>
    </>
  );
};

export default RestockHub;

export async function getStaticProps(context: any) {
  const popularShops = await getTrendingShops(4).catch(() => []);

  return {
    props: {
      trendingShops: popularShops,
      messages: await loadTranslation(context.locale as string, 'restock/index'),
      locale: context.locale,
    },
    revalidate: 24 * 60 * 60, // 24 hours
  };
}

RestockHub.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  const canonical =
    props.locale === 'en'
      ? `https://itemdb.com.br/restock`
      : `https://itemdb.com.br/${props.locale}/restock`;

  return (
    <Layout
      SEO={{
        title: t('Restock.neopets-restock-helper'),
        description: t('Restock.restock-description'),
        themeColor: '#A5DAE9',
        canonical: canonical,
      }}
      mainColor="rgba(165, 218, 233, 0.4)"
    >
      {page}
    </Layout>
  );
};
