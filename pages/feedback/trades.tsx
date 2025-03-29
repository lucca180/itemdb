import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Kbd,
  Link,
  List,
  ListIcon,
  ListItem,
  Spinner,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { GetServerSidePropsContext, NextApiRequest } from 'next';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { BsXLg, BsXCircleFill, BsCheckCircleFill, BsCheckLg } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import FeedbackTrade from '../../components/FeedbackCards/FeedbackTrade';
import Layout from '../../components/Layout';
import { TradeData } from '../../types';
import { useAuth } from '../../utils/auth';
import { CheckAuth } from '../../utils/googleCloud';
import { createTranslator, useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';

const FeedbackSuggest = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [prevTrades, setPrev] = useState<TradeData[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const popularItem = useRef<string | undefined>(undefined);
  const skippedTrades = useRef<string[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      init();
    }
  }, [authLoading]);

  const init = async () => {
    setIsLoading(true);
    const res = await axios.get('/api/v1/trades/pricefy', {
      params: {
        itemName: popularItem.current ?? router.query.target,
        skipList: skippedTrades.current.join(','),
      },
    });

    const data = res.data as { trades: TradeData[]; popularItem: string | null };

    popularItem.current = data.popularItem ?? undefined;

    setTrades(data.trades);
    setCurrentTrade(data.trades[0]);
    setIsLoading(false);
  };

  const handleSubmitAdmin = async (trade: TradeData) => {
    setIsLoading(true);

    try {
      const res = await axios.patch('/api/v1/trades', {
        trade: trade,
      });

      if (res.data.success) await handleSkip(true);
      else throw res.data;

      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (trade: TradeData) => {
    setIsLoading(true);

    if (!trade || !user) return;

    if (user.role === 'ADMIN') return handleSubmitAdmin(trade);

    const feedbackJSON = {
      trade: trade,
    };

    try {
      const res = await axios.post('/api/feedback/send', {
        pageInfo: '/feedback/trades',
        subject_id: trade.trade_id,
        user_id: user.id,
        type: 'tradePrice',
        json: JSON.stringify(feedbackJSON),
      });

      if (res.data.success) await handleSkip(true);
      else throw res.data;

      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsLoading(false);
    }
  };

  const handleSkip = async (isNext = false) => {
    if (currentTrade) {
      setPrev([...prevTrades, currentTrade]);

      if (!isNext) skippedTrades.current.push(currentTrade.trade_id.toString());
    }

    const newTrades = trades.filter((trade) => trade.trade_id !== currentTrade?.trade_id);

    if (newTrades.length === 0) {
      setTrades([]);
      setCurrentTrade(undefined);
      await init();

      return;
    }

    setTrades(newTrades);
    setCurrentTrade(newTrades[0]);
  };

  const handleUndo = () => {
    const newTrades = [prevTrades[prevTrades.length - 1], ...trades];
    setTrades(newTrades);
    setCurrentTrade(newTrades[0]);
    setPrev(prevTrades.slice(0, prevTrades.length - 1));
  };

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        breadcrumb={
          <Breadcrumbs
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: t('Layout.feedback'),
                item: '/feedback',
              },
              {
                position: 3,
                name: t('Layout.trade-pricing'),
                item: '/feedback/trades',
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('Feedback.the-feedback-system')}
        </Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          {t('Feedback.feedback-system-description')}
        </Text>
      </HeaderCard>
      <Flex
        mt={8}
        gap={6}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
      >
        <CardBase
          chakraWrapper={{ maxW: '700px' }}
          title={t('Feedback.trade-pricing-guidelines')}
          chakra={{ bg: 'gray.700' }}
        >
          <TradeGuidelines />
        </CardBase>
        <Flex
          flex="2"
          flexFlow={{ base: 'column-reverse', md: 'column' }}
          h="100%"
          w="100%"
          gap={4}
        >
          {!isLoading && currentTrade && (
            <>
              <FeedbackTrade
                hasUndo={prevTrades.length > 0}
                handleUndo={handleUndo}
                trade={currentTrade}
                handleSubmit={handleSubmit}
                handleSkip={handleSkip}
              />
              <Text
                fontSize={'xs'}
                color={'gray.400'}
                textAlign={'center'}
                display={{ base: 'none', md: 'initial' }}
              >
                {t.rich('Feedback.keyboard-submit', {
                  Kbd: (chunk) => <Kbd>{chunk}</Kbd>,
                })}
              </Text>
            </>
          )}
          {isLoading && (
            <Center>
              <Spinner size="lg" />
            </Center>
          )}
          {!isLoading && !currentTrade && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('Feedback.thanks-for-helping-out-want-more-trades')}</Text>
              <Button onClick={init}>{t('Feedback.yes-i-need-it')}</Button>
              <Box>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {t('Feedback.nothing-happens')}
                </Text>
                <Text fontSize="xs" color="gray.200" textAlign="center">
                  <Link href="/feedback/vote">
                    {t('Feedback.you-can-also-vote-some-suggestions')}{' '}
                    <ExternalLinkIcon verticalAlign={'center'} />
                  </Link>
                </Text>
              </Box>
            </Center>
          )}
          {error && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('General.something-went-wrong')} :(</Text>
              <Button onClick={init}>{t('General.try-again')}</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </>
  );
};

export default FeedbackSuggest;

export const TradeGuidelines = () => {
  const t = useTranslations();
  return (
    <Box fontSize={'sm'}>
      <Text>
        {t.rich('Feedback.pt-1', {
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Alert status={'info'} my={6} variant="subtle" borderRadius={'md'}>
        <AlertIcon />
        <Box w="100%">
          <AlertTitle>{t('Feedback.10-02-2024-policy-changes')}</AlertTitle>
          <AlertDescription fontSize="xs">
            {t.rich('Feedback.new-policy-1', {
              b: (chunk) => <b>{chunk}</b>,
            })}
            <br />
            <br />
            {t.rich('Feedback.new-policy-2', {
              b: (chunk) => <b>{chunk}</b>,
            })}
          </AlertDescription>
        </Box>
      </Alert>
      <Heading size="md" mt={6} color="red.300">
        <Icon as={BsXLg} verticalAlign="middle" /> {t('Feedback.donts')}
      </Heading>
      <Text>{t('Feedback.pt-2')}</Text>
      <List mt={3} spacing={3}>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-3')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-4')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-5')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-6')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-7')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-8')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-9')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-10')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-11')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-12')}{' '}
          </Text>
        </ListItem>
      </List>
      <Heading size="md" mt={6} color="green.300">
        <Icon as={BsCheckLg} verticalAlign="middle" /> {t('Feedback.dos')}
      </Heading>
      <List mt={3} spacing={3}>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-13')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-14')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-15')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-16')}
          <br />
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-17')}
          <br />
          <Text fontSize="xs" color="gray.400">
            {t('Feedback.pt-18')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-19')}
          <br />
        </ListItem>
      </List>
    </Box>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const check = await CheckAuth(context.req as NextApiRequest);
    if (!check.user) throw new Error('User not found');

    if (check.user.banned) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        messages: (await import(`../../translation/${context.locale}.json`)).default,
        locale: context.locale,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
}

FeedbackSuggest.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('Feedback.trade-pricing-feedback'),
        description: t('Feedback.feedback-system-description'),
      }}
      mainColor="#4A5568c7"
    >
      {page}
    </Layout>
  );
};
