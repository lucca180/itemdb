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
import { useEffect, useState } from 'react';
import { BsXLg, BsXCircleFill, BsCheckCircleFill, BsCheckLg } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import FeedbackTrade from '../../components/FeebackCards/FeedbackTrade';
import Layout from '../../components/Layout';
import { TradeData } from '../../types';
import { useAuth } from '../../utils/auth';

const FeedbackSuggest = () => {
  const { user, authLoading, getIdToken } = useAuth({ redirect: '/login' });
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [prevTrades, setPrev] = useState<TradeData[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user) init();
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
    <Layout SEO={{ title: 'Trade Pricing - Feedback' }}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
      >
        <Heading size="lg">The Feedback System</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          Most of our content is collected and categorized automatically but there are some things
          our machines can&apos;t do. And you can help it!
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
          title="Trade Pricing Guidelines"
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
              <Text>Thanks for helping out! Want more trades?</Text>
              <Button onClick={init}>YES I NEED IT!!!!!</Button>
              <Box>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  If you click the button and nothing happens you really vote for everything...
                  impressive.
                </Text>
                <Text fontSize="xs" color="gray.200" textAlign="center">
                  <Link href="/feedback/vote">
                    You can also vote some suggestions <ExternalLinkIcon verticalAlign={'center'} />
                  </Link>
                </Text>
              </Box>
            </Center>
          )}
          {error && (
            <Center flexFlow="column" gap={4}>
              <Text>Something went wrong :(</Text>
              <Button onClick={init}>Try again</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </Layout>
  );
};

export default FeedbackSuggest;

export const TradeGuidelines = () => {
  return (
    <>
      <Text>
        Pricing trade lots is very simple (and therapeutic, some would say), but to ensure that all
        information is correct we have some <b>do&apos;s and don&apos;ts</b>:
      </Text>
      <Heading size="md" mt={6} color="red.300">
        <Icon as={BsXLg} verticalAlign="middle" /> Don&apos;ts
      </Heading>
      <Text>Ground Rule is: if the wishlist leaves doubts about the price, leave it blank.</Text>
      <List mt={3} spacing={3}>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          Assume prices that are not explicitly described.
          <br />
          <Text fontSize="sm" color="gray.400">
            Eg: a lot with junk items and only one &quot;valuable&quot; item and the owner asks only
            one price for the whole lot
          </Text>
          <Text fontSize="sm" color="gray.400">
            However if the &quot;valuable item&quot; is WAY more valuable than the others you can
            assume the wishlist is referring to it.
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          Divide the lot unique price by the number of items if the items are different
          <br />
          <Text fontSize="sm" color="gray.400">
            Eg: &quot;paperclip trade - 10 items 100np&quot; -{'>'} it&apos;s not right to assume
            that each item costs 10NP
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          Use other item&apos;s price to compose the lot price
          <br />
          <Text fontSize="sm" color="gray.400">
            Eg: &quot;6 baby pb + 100k&quot; or &quot;2m + HTS&quot; -{'>'} leave it blank
          </Text>
          <Text fontSize="sm" color="gray.400">
            However if the other item&apos;s price is negligible, you can just assume the value in
            pure
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsXCircleFill} color="red.300" />
          Precify &quot;1NP&quot; or &quot;paperclip&quot; kind of trades
          <br />
          <Text fontSize="sm" color="gray.400">
            Eg: &quot;baby pb for 1np merry christmas&quot; -{'>'} leave it blank
          </Text>
        </ListItem>
      </List>
      <Heading size="md" mt={6} color="green.300">
        <Icon as={BsCheckLg} verticalAlign="middle" /> Do&apos;s
      </Heading>
      <List mt={3} spacing={3}>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Price only items with explicit price
          <br />
          <Text fontSize="sm" color="gray.400">
            Eg: &quot;10m | 5m | nm | 10m&quot; -{'>'} leave the &quot;nm&quot; item blank and
            precify the others
          </Text>
          <Text fontSize="sm" color="gray.400">
            However if the &quot;valuable item&quot; is WAY more valuable than the others you can
            assume the wishlist is referring to it.
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Always use individual item prices
          <br />
          {/* <Text fontSize='sm' color="gray.400">Eg: "6 baby pb + 100k" or "2m + HTS" -{">"} leave it blank</Text> */}
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          Divide the lot unique price by the number of items if items are equal
          <br />
          <Text fontSize="sm" color="gray.400">
            Round the value to the nearest integer
          </Text>
        </ListItem>
        <ListItem>
          <ListIcon as={BsCheckCircleFill} color="green.300" />
          &quot;At least 500k&quot;, &quot;500k OBO&quot;, &quot;Around 500k&quot; -{'>'} use 500k
          <br />
        </ListItem>
      </List>
    </>
  );
};
