import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Link,
  List,
  ListIcon,
  ListItem,
  Spinner,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { NextApiRequest, NextPageContext } from 'next';
import { useEffect, useState } from 'react';
import { BsXLg, BsXCircleFill, BsCheckCircleFill, BsCheckLg } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import FeedbackTrade from '../../components/FeebackCards/FeedbackTrade';
import Layout from '../../components/Layout';
import { TradeData } from '../../types';
import { useAuth } from '../../utils/auth';
import { CheckAuth } from '../../utils/googleCloud';
import { useTranslations } from 'next-intl';

const FeedbackSuggest = () => {
  const t = useTranslations();
  const { user, authLoading, getIdToken } = useAuth();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [prevTrades, setPrev] = useState<TradeData[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user) {
      init();
    }
  }, [authLoading]);

  const init = async () => {
    setIsLoading(true);
    const res = await axios.get('/api/v1/trades/latest?random=true');

    setTrades(res.data);
    setCurrentTrade(res.data[0]);
    setIsLoading(false);
  };

  const handleSubmitAdmin = async (trade: TradeData) => {
    setIsLoading(true);

    const token = await getIdToken();
    try {
      const res = await axios.patch(
        '/api/v1/trades',
        {
          trade: trade,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) handleSkip();
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

      if (res.data.success) handleSkip();
      else throw res.data;

      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentTrade) setPrev([...prevTrades, currentTrade]);
    const newTrades = trades.filter((trade) => trade.trade_id !== currentTrade?.trade_id);
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
    <Layout
      SEO={{
        title: t('Feedback.trade-pricing-feedback'),
        description: t('Feedback.feedback-system-description'),
      }}
    >
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
      >
        <Heading size="lg">{t('Feedback.the-feedback-system')}</Heading>
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
          chakraWrapper={{ flex: 2 }}
          title={t('Feedback.trade-pricing-guidelines')}
          chakra={{ bg: 'gray.700' }}
        >
          <TradeGuidelines />
        </CardBase>
        <Flex
          flex="1"
          flexFlow={{ base: 'column-reverse', md: 'column' }}
          h="100%"
          w="100%"
          gap={4}
        >
          {!isLoading && currentTrade && (
            <FeedbackTrade
              hasUndo={prevTrades.length > 0}
              handleUndo={handleUndo}
              trade={currentTrade}
              handleSubmit={handleSubmit}
              handleSkip={handleSkip}
            />
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
    </Layout>
  );
};

export default FeedbackSuggest;

export const TradeGuidelines = () => {
  const t = useTranslations();
  return (
    <>
      <Text>
        {t.rich('Feedback.pt-1', {
          b: (chunk) => <b>{chunk}</b>,
        })}
      </Text>
      <Heading size="md" mt={6} color="red.300">
        <Icon as={BsXLg} verticalAlign="middle" /> {t('Feedback.donts')}
      </Heading>
      <Text>{t('Feedback.pt-2')}</Text>
      <List mt={3} spacing={3}>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-3')}
          <br />
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-4')}
          </Text>
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-5')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-6')}
          <br />
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-7')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-8')}
          <br />
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-9')}
          </Text>
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-10')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          {t('Feedback.pt-11')}
          <br />
          <Text fontSize="sm" color="gray.400">
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
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-14')}
          </Text>
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-15')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-16')}
          <br />
          {/* <Text fontSize='sm' color="gray.400">Eg: "6 baby pb + 100k" or "2m + HTS" -{">"} leave it blank</Text> */}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-17')}
          <br />
          <Text fontSize="sm" color="gray.400">
            {t('Feedback.pt-18')}
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          {t('Feedback.pt-19')}
          <br />
        </ListItem>
      </List>
    </>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  try {
    const token = getCookie('userToken', { req: context.req, res: context.res }) as
      | string
      | undefined
      | null;

    if (!token) throw new Error('No token found');

    await CheckAuth(context.req as NextApiRequest, token);

    return {
      props: {
        messages: (await import(`../../translation/${context.locale}.json`)).default,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}
