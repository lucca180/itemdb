/* eslint-disable react/no-unescaped-entities */
import { createTranslator, useFormatter } from 'next-intl';
import { ReactElement } from 'react';
import Layout from '../../../components/Layout';
import { Image, Flex, Grid, GridItem, Heading, Text, Link } from '@chakra-ui/react';
import { msIntervalFormatted, restockShopInfo } from '../../../utils/utils';
import { AnimatedNumber } from '../../../components/Utils/AnimatedNumber';
import { RestockStats, User } from '../../../types';
import ItemCard from '../../../components/Items/ItemCard';
import { StatsCard } from '../../../components/Hubs/Restock/StatsCard';
import { CheckAuth } from '../../../utils/googleCloud';
import { getWrapped } from '../../api/v1/restock/wrapped';
import { NextApiRequest } from 'next';
import WrappedTimeline from '../../../components/Hubs/Wrapped2024/Timeline';
import NextLink from 'next/link';
import { loadTranslation } from '@utils/load-translation';
import FeedbackButton from '@components/Feedback/FeedbackButton';

type Wrapped2024Props = {
  wrappedData: RestockStats;
  monthlyData: RestockStats[];
  user: User;
  messages: any;
  error?: string;
};

const Wrapped2024 = (props: Wrapped2024Props) => {
  const formatter = useFormatter();
  const { wrappedData, user, monthlyData, error } = props;

  if (error || !wrappedData || !monthlyData || !user)
    return (
      <Flex flexFlow={'column'}>
        <Flex
          left={0}
          zIndex={-1}
          position={'absolute'}
          w="100%"
          h={'calc(100vh - 160px)'}
          alignItems={'flex-end'}
          overflow={'hidden'}
          _before={{
            content: '""',
            position: 'absolute',
            display: 'block',
            w: '99.5vw',
            h: '100%',
            top: 0,
            zIndex: -1,
            opacity: 0.75,
            filter: 'brightness(0.75)',
            background: 'url(/img/bg1.svg)',
            bgSize: 'cover',
            bgPos: 'center',
          }}
          _after={{
            bgGradient: 'linear(to-b, #15B392, #54C392, #73EC8B)',
            content: '""',
            position: 'absolute',
            display: 'block',
            w: '99.5vw',
            h: '100%',
            top: 0,
            zIndex: -2,
          }}
        >
          <Grid
            templateColumns="repeat(10, 1fr)"
            minW={'200%'}
            gap={0}
            autoFlow={'dense'}
            autoRows={'max-content'}
            position={'absolute'}
            sx={{
              mask: 'linear-gradient(0, black 45%, rgba(0, 0, 0, 0) 95%)',
            }}
            animation={'restock2024 100s ease-out alternate infinite'}
          >
            {Object.values(restockShopInfo)
              .slice(0, 30)
              .map((shop) => (
                <GridItem key={shop.id} w={'450px'}>
                  <Image
                    src={`https://images.neopets.com/shopkeepers/w${shop.id}.gif`}
                    opacity={0.2}
                    saturate={0.2}
                    alt={shop.name}
                    h={'150px'}
                    w={'450px'}
                  />
                </GridItem>
              ))}
          </Grid>
        </Flex>
        <Flex
          w="100%"
          h={'calc(100vh - 160px)'}
          py={8}
          flexFlow={'column'}
          alignItems={'center'}
          position={'relative'}
          gap={8}
        >
          <Text>What a year, huh?</Text>
          <Heading
            size={'4xl'}
            fontWeight={'extrabold'}
            maxW={{ base: '90vw', lg: '800px' }}
            textAlign={'center'}
          >
            <Text as="span" color="#D2FF72">
              2024 Restock Review
            </Text>
          </Heading>
          <Text as="div" mt={8} textAlign={'center'}>
            {errorCodeToMessage(error ?? '')}
          </Text>
        </Flex>
      </Flex>
    );

  return (
    <Flex flexFlow={'column'} minH={'200vh'}>
      <Flex
        left={0}
        zIndex={-1}
        position={'absolute'}
        w="100%"
        h={'calc(100vh - 160px)'}
        alignItems={'flex-end'}
        overflow={'hidden'}
        _before={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.75,
          filter: 'brightness(0.75)',
          background: 'url(/img/bg1.svg)',
          bgSize: 'cover',
          bgPos: 'center',
        }}
        _after={{
          bgGradient: 'linear(to-b, #15B392, #54C392, #73EC8B)',
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -2,
        }}
      >
        <Grid
          templateColumns="repeat(10, 1fr)"
          minW={'200%'}
          gap={0}
          autoFlow={'dense'}
          autoRows={'max-content'}
          position={'absolute'}
          sx={{
            mask: 'linear-gradient(0, black 45%, rgba(0, 0, 0, 0) 95%)',
          }}
          animation={'restock2024 100s ease-out alternate infinite'}
        >
          {Object.values(restockShopInfo)
            .slice(0, 30)
            .map((shop) => (
              <GridItem key={shop.id} w={'450px'}>
                <Image
                  src={`https://images.neopets.com/shopkeepers/w${shop.id}.gif`}
                  opacity={0.2}
                  saturate={0.2}
                  alt={shop.name}
                  h={'150px'}
                  w={'450px'}
                />
              </GridItem>
            ))}
        </Grid>
      </Flex>
      <Flex
        w="100%"
        h={'calc(100vh - 160px)'}
        py={8}
        flexFlow={'column'}
        alignItems={'center'}
        position={'relative'}
        gap={8}
      >
        <Text>Hi, {user.username}!</Text>
        <Heading
          size={'4xl'}
          fontWeight={'extrabold'}
          maxW={{ base: '90vw', lg: '800px' }}
          textAlign={'center'}
        >
          Your{' '}
          <Text as="span" color="#D2FF72">
            2024 Restock Review
          </Text>{' '}
          is here!
        </Heading>
        <Text mt={8}>What a year, huh?</Text>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        // minH={'700px'}
        flexFlow={'column'}
        alignItems={'center'}
        py={8}
        px={3}
        position={'relative'}
        _after={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.2,
          background: 'url(/img/bg2.svg)',
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading size={'2xl'} fontWeight={'extrabold'} maxW={'800px'} textAlign={'center'}>
            Your Estimate Revenue
          </Heading>
          <Text fontSize={'sm'}>
            That's if you sold{' '}
            <Text as="span" color="#73EC8B" fontWeight={'extrabold'}>
              every single thing
            </Text>{' '}
            for the price we told you to...
          </Text>
        </Flex>
        <Flex flexFlow={'column'} alignItems={'center'}>
          <Heading
            mt={'100px'}
            fontSize={{ base: '3.5rem', lg: '6rem' }}
            fontWeight={'extrabold'}
            color="#D2FF72"
            textAlign={'center'}
          >
            <AnimatedNumber value={wrappedData?.estRevenue ?? 0} /> NP
          </Heading>
          <Text fontSize={'sm'}>
            You'll be able to afford that new{' '}
            <Text as="span" color="#e63a19" fontWeight={'extrabold'}>
              Ferrari
            </Text>{' '}
            soon!
          </Text>
        </Flex>
        <Flex flexFlow={'column'} mt={'100px'} alignItems={'center'}>
          <Heading size={'lg'} fontWeight={'extrabold'} maxW={'800px'} textAlign={'center'}>
            and this was your go-to item
          </Heading>
          <Text mb={5} fontSize={'sm'}>
            you bought it{' '}
            <Text as="span" color="#D2FF72" fontWeight={'extrabold'}>
              {wrappedData?.favoriteItem?.count}
            </Text>{' '}
            times! wow
          </Text>
          {wrappedData?.favoriteItem && <ItemCard item={wrappedData.favoriteItem.item!} />}
        </Flex>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        minH={'900px'}
        flexFlow={'column'}
        alignItems={'center'}
        py={8}
        px={3}
        gap={8}
        textShadow={'2px 2px 5px rgba(0,0,0,.2)'}
        position={'relative'}
        _after={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.75,
          backgroundImage: 'url(/img/bg3.svg)',
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading size={'2xl'} fontWeight={'extrabold'} maxW={'800px'} textAlign={'center'}>
            And speaking of{' '}
            <Text as="span" color="#FFF9BF" fontWeight={'extrabold'}>
              items
            </Text>
            ...
          </Heading>
          <Text fontSize={'sm'} mt={2}>
            You bought{' '}
            <Text as="span" color="#FFF9BF" fontWeight={'extrabold'}>
              {wrappedData?.totalBought.count}
            </Text>{' '}
            of them. But these were the hottest ones!
          </Text>
        </Flex>
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap={3}>
          {wrappedData?.hottestBought.map((buy) => (
            <GridItem key={buy.item.internal_id}>
              <ItemCard key={buy.item.internal_id} small item={buy.item} />
            </GridItem>
          ))}
        </Grid>
        <Text fontSize={'sm'} textAlign={'center'}>
          These were the prices at the time you bought them
        </Text>
        <Flex flexFlow={'column'} alignItems={'center'}>
          <Heading size={'lg'} fontWeight={'extrabold'} maxW={'800px'} textAlign={'center'}>
            You absolutely{' '}
            <Text as="span" color="#FFF9BF" fontWeight={'extrabold'}>
              sniped
            </Text>{' '}
            this one
          </Heading>
          <Text mb={5} fontSize={'sm'}>
            it took{' '}
            <Text as="span" color="#FFF9BF" fontWeight={'extrabold'}>
              {msIntervalFormatted(wrappedData?.fastestBuy?.timediff ?? 0, false, 2)}
            </Text>{' '}
            for you to buy it
          </Text>
          {wrappedData?.fastestBuy && <ItemCard item={wrappedData.fastestBuy.item!} />}
        </Flex>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        minH={'1000px'}
        flexFlow={'column'}
        alignItems={'center'}
        py={8}
        px={3}
        textShadow={'2px 2px 5px rgba(0,0,0,.2)'}
        position={'relative'}
        gap={8}
        textAlign={'center'}
        _after={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.75,
          filter: 'brightness(0.8)',
          background: 'url(/img/bg4.svg)',
          backgroundPosition: 'center',
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading
            size={'2xl'}
            fontWeight={'extrabold'}
            maxW={'800px'}
            textAlign={'center'}
            sx={{ textWrap: 'balance' }}
            display={'block'}
          >
            But not only of{' '}
            <Text as="span" color="#DE7C7D" fontWeight={'extrabold'}>
              victories
            </Text>{' '}
            is made a year
          </Heading>
          <Text fontSize={'sm'} mt={2}>
            You lost{' '}
            <Text as="span" color="#DE7C7D" fontWeight={'extrabold'}>
              {wrappedData?.totalLost.count} items
            </Text>{' '}
            you tried to buy. Must be bots am I right?
          </Text>
        </Flex>
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap={3}>
          {wrappedData?.hottestLost.slice(0, 10).map((buy) => (
            <GridItem key={buy.item.internal_id}>
              <ItemCard key={buy.item.internal_id} small item={buy.item} />
            </GridItem>
          ))}
        </Grid>
        <Flex flexFlow={'column'}>
          <Text fontSize={'sm'} textAlign={'center'}>
            These were the prices at the time you lost them
            <br />
          </Text>
          <Text fontSize={'xs'} textAlign={'center'} opacity={0.85}>
            btw, you could have earned{' '}
            <Text as="span" fontSize={'xs'} color={'#DE7C7D'} fontWeight={'bold'}>
              {formatter.number(wrappedData?.totalLost.value ?? 0)} NP
            </Text>{' '}
            but who is counting?
          </Text>
        </Flex>
        <Flex flexFlow={'column'} alignItems={'center'}>
          <Heading size={'lg'} fontWeight={'extrabold'} maxW={'800px'} textAlign={'center'}>
            You didn't even{' '}
            <Text as="span" color="#DE7C7D" fontWeight={'extrabold'}>
              see
            </Text>{' '}
            these ones coming
          </Heading>
          <Text mb={5} fontSize={'sm'}>
            They showed up and passed by without leaving a message
          </Text>
          <Flex gap={3} wrap={'wrap'} justifyContent={'center'}>
            {wrappedData &&
              hottestMiss(wrappedData)
                .slice(0, 5)
                .map((item) => <ItemCard key={item.internal_id} item={item} small />)}
          </Flex>
        </Flex>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        minH={'600px'}
        flexFlow={'column'}
        alignItems={'center'}
        px={3}
        py={8}
        gap={8}
        textShadow={'2px 2px 5px rgba(0,0,0,.2)'}
        position={'relative'}
        _after={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.75,
          background: 'url(/img/bg6.svg)',
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading
            size={'2xl'}
            fontWeight={'extrabold'}
            maxW={'800px'}
            textAlign={'center'}
            sx={{ textWrap: 'balance' }}
            display={'block'}
          >
            Now let's talk about you,{' '}
            <Text as="span" color={'#79D7BE'} fontWeight={'bold'}>
              {user.username}
            </Text>
          </Heading>
        </Flex>
        {wrappedData && (
          <Flex maxW="4xl" gap={3} flexWrap={'wrap'} justifyContent={'center'}>
            <StatsCard type="reactionTime" session={wrappedData} />
            <StatsCard type="timeSpent" session={wrappedData} />
            <StatsCard type="refreshTime" session={wrappedData} />
          </Flex>
        )}
        <Flex flexFlow={'column'}>
          <Text fontSize={'sm'} textAlign={'center'}>
            Wow{' '}
            <Text as="span" color={'#79D7BE'} fontWeight={'bold'}>
              {msIntervalFormatted(wrappedData?.mostPopularShop.durationCount ?? 0, true, 2)}
            </Text>{' '}
            at{' '}
            <Text as="span" color={'#79D7BE'} fontWeight={'bold'}>
              {restockShopInfo[wrappedData!.mostPopularShop.shopId].name}
            </Text>
            <br /> The shopkeeper must know you by name now!
          </Text>
          <Image
            src={getShopImg(wrappedData.mostPopularShop.shopId)}
            alt={restockShopInfo[wrappedData.mostPopularShop.shopId].name}
            mt={3}
            borderRadius={'md'}
            boxShadow={'md'}
          />
        </Flex>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        w="100%"
        flexFlow={'column'}
        alignItems={'center'}
        py={8}
        px={1}
        textShadow={'2px 2px 5px rgba(0,0,0,.2)'}
        position={'relative'}
        _before={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          opacity: 0.85,
          top: 0,
          zIndex: -1,
          background: 'url(/img/bg8.svg)',
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading
            size={'2xl'}
            fontWeight={'extrabold'}
            maxW={'800px'}
            textAlign={'center'}
            sx={{ textWrap: 'balance' }}
            display={'block'}
          >
            Overview of Your 2024
          </Heading>
        </Flex>
        <Flex flexFlow={'column'} mt={8} w="100%">
          <WrappedTimeline wrappedData={wrappedData} monthlyData={monthlyData} />
        </Flex>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        w="100%"
        minH={'700px'}
        flexFlow={'column'}
        alignItems={'center'}
        p={8}
        // textShadow={'2px 2px 5px rgba(0,0,0,.2)'}
        position={'relative'}
        _before={{
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -1,
          opacity: 0.75,
          filter: 'brightness(0.75)',
          background: 'url(/img/bg1.svg)',
          bgSize: 'cover',
          bgPos: 'center',
        }}
        _after={{
          bgGradient: 'linear(to-b, #15B392, #54C392, #73EC8B)',
          content: '""',
          position: 'absolute',
          display: 'block',
          w: '99.5vw',
          h: '100%',
          top: 0,
          zIndex: -2,
        }}
      >
        <Flex flexFlow={'column'} alignItems={'center'} textAlign={'center'}>
          <Heading
            size={'2xl'}
            fontWeight={'extrabold'}
            maxW={'800px'}
            textAlign={'center'}
            sx={{ textWrap: 'balance' }}
            display={'block'}
          >
            We had a{' '}
            <Text as="span" color="#D2FF72">
              nice year
            </Text>{' '}
            together
          </Heading>
          <Text fontSize={'sm'} mt={2}>
            And we hope to see you again in the next one too!
          </Text>
        </Flex>
        <Flex flexFlow={'column'} mt={8} alignItems={'center'} gap={2}>
          <Text>We're always open to your feedback and ideas, so feel free to reach out!</Text>
          <FeedbackButton
            variant={'solid'}
            boxShadow={'md'}
            bg={'#D2FF72'}
            color="blackAlpha.800"
          />
        </Flex>
        <Flex>
          <Text fontSize={'sm'}>
            You should visit this page back again in 2025 to check out the updated stats with the
            December data!
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Wrapped2024;

export async function getServerSideProps(context: any) {
  try {
    if (process.env.DISABLE_RESTOCK_2024 === 'true') {
      throw 'maintenance';
    }

    let res;

    try {
      res = await CheckAuth(context.req as NextApiRequest);

      if (!res || !res.user || res.user.banned) {
        throw 'unauthorized';
      }
    } catch (e) {
      throw 'unauthorized';
    }

    const data = await getWrapped(res.user.id, 2024);

    return {
      props: {
        wrappedData: data.wrapped,
        monthlyData: data.monthly,
        user: res.user,
        messages: await loadTranslation(context.locale as string, 'restock/dashboard/2024'),
      },
    };
  } catch (e) {
    if (typeof e !== 'string') {
      console.error(e);
    }

    return {
      props: {
        error: typeof e === 'string' ? e : 'unknown',
        messages: await loadTranslation(context.locale as string, 'restock/dashboard/2024'),
      },
    };
  }
}

Wrapped2024.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  const canonical = 'https://itemdb.com.br/restock/dashboard/2024';

  return (
    <Layout
      SEO={{
        title: '2024 Restock Review',
        description: t('Restock.restock-dashboard-desc'),
        themeColor: '#58ab7c',
        canonical: canonical,
      }}
      mainColor="#58ab7c"
    >
      {page}
    </Layout>
  );
};

const hottestMiss = (wrappedData: RestockStats) => {
  const allBought = wrappedData.hottestBought.map((buy) => buy.item.internal_id);
  const allLost = wrappedData.hottestLost.map((lost) => lost.item.internal_id);

  return wrappedData.hottestRestocks.filter((restock) => {
    const itemId = restock.internal_id;
    return !allBought.includes(itemId) && !allLost.includes(itemId);
  });
};

const errorCodeToMessage = (code: string) => {
  switch (code) {
    case 'unauthorized':
      return 'Please check if you are signed in';
    case 'notReady':
      return (
        <>
          Your data is in the processing queue
          <br />
          Please come back later
          <Text fontSize={'sm'} opacity={0.87} mt={3}>
            You can improve your position in the queue by helping us with{' '}
            <Link as={NextLink} href="/feedback/trades" color="#D2FF72">
              Trade Pricing
            </Link>{' '}
            or{' '}
            <Link as={NextLink} href="/feedback/vote" color="#D2FF72">
              Voting on Suggestions
            </Link>
          </Text>
        </>
      );
    case 'notFound':
      return 'You needed to have uploaded restock sessions before december 2024 to access the Restock Review 2024. Please try again next year.';
    case 'maintenance':
      return 'The 2024 Restock Review is currently disabled for maintenance. Please try again later.';
    default:
      return 'An error occurred';
  }
};

const getShopImg = (shopId: number) => {
  if (shopId >= 1) {
    return `https://images.neopets.com/shopkeepers/w${shopId}.gif`;
  }

  if (shopId === -1) {
    return 'https://images.neopets.com/halloween/ghost_shop.gif';
  }

  if (shopId === -2) {
    return 'https://images.neopets.com/winter/eskimo2.gif';
  }
};
