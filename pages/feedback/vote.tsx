import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Spinner,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BsArrowDownCircleFill, BsArrowUpCircleFill } from 'react-icons/bs';
import CardBase from '../../components/Card/CardBase';
import HeaderCard from '../../components/Card/HeaderCard';
import FeedbackItem from '../../components/FeebackCards/FeedbackItem';
import Layout from '../../components/Layout';
import TradeTable from '../../components/Trades/TradeTable';
import { Feedback, TradeData } from '../../types';
import { useAuth } from '../../utils/auth';
import { TradeGuidelines } from './trades';

const FeedbackVotingPage = () => {
  const { user, authLoading, getIdToken } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!authLoading && user) {
      console.log(authLoading, user);
      init();
    }
  }, [authLoading, user]);

  const init = async () => {
    setError('');
    setIsLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token');

      const res = await axios.get('/api/feedback/getLatest', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data: Feedback[] = res.data.map((d: Feedback) => {
        const parsed = JSON.parse(d.json);
        return {
          ...d,
          parsed: parsed,
        };
      });

      setFeedbacks(data);
      setCurrentFeedback(data[0]);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setIsLoading(false);
  };

  const handleVote = async (action: 'upvote' | 'downvote') => {
    setIsLoading(true);

    try {
      if (!currentFeedback) throw new Error('No feedback selected');
      const token = await getIdToken();
      if (!token) throw new Error('No token');

      const res = await axios.post(
        '/api/feedback/vote',
        {
          action,
          feedback_id: currentFeedback?.feedback_id,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const newFeedbacks = feedbacks.filter(
          (f) => f.feedback_id !== currentFeedback?.feedback_id
        );
        setFeedbacks(newFeedbacks);
        setCurrentFeedback(newFeedbacks[0]);
      } else throw new Error(res.data.message);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }

    setIsLoading(false);
  };

  return (
    <Layout SEO={{ title: 'Voting - Feedback' }}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
          alt: 'quiz-giver thumbnail',
        }}
        // color="#7AB92A"
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
        sx={{ b: { color: 'blue.200' } }}
      >
        <CardBase chakraWrapper={{ flex: 2 }} title="Voting" chakra={{ bg: 'gray.700' }}>
          <Text>
            Either way, the more you contribute correctly the more our systems will trust your
            information - meaning your suggestions will be live faster.
          </Text>
          <Accordion allowMultiple mt={4}>
            <AccordionItem>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight={'bold'}>Trade Pricing</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <TradeGuidelines />
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight={'bold'}>Item Tags and Notes</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <TagAndNotesGuidelines />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          <Center mt={4} fontStyle="italic" fontSize="sm">
            I love democracy - Sheev
          </Center>
        </CardBase>
        <Flex
          flex="1"
          flexFlow="column"
          alignItems="center"
          justifyContent="flex-start"
          h="100%"
          w="100%"
        >
          {isLoading && (
            <Center>
              <Spinner size="lg" />
            </Center>
          )}

          {!isLoading && !currentFeedback && !error && (
            <Center flexFlow="column" gap={4}>
              <Text>Thanks for helping out! Want more?</Text>
              <Button onClick={init}>YES I NEED IT!!!!!</Button>
              <Box>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  If you click the button and nothing happens you really vote for everything...
                  impressive.
                </Text>
                <Text fontSize="xs" color="gray.200" textAlign="center">
                  <Link href="/feedback/trades">
                    You can also price some trades <ExternalLinkIcon verticalAlign={'center'} />
                  </Link>
                </Text>
              </Box>
            </Center>
          )}

          {!isLoading && currentFeedback && !error && (
            <>
              <CardBase
                chakraWrapper={{ flex: 1, width: '100%' }}
                title="Feedback Voting"
                chakra={{ bg: 'gray.700' }}
              >
                {currentFeedback.type === 'tradePrice' && (
                  <TradeTable data={currentFeedback.parsed?.content.trade as TradeData} />
                )}
                {currentFeedback.type === 'itemChange' && (
                  <FeedbackItem
                    itemNotes={currentFeedback.parsed?.content.itemNotes as string | undefined}
                    itemTags={currentFeedback.parsed?.content.itemTags as string[]}
                    item_iid={currentFeedback.subject_id as number}
                  />
                )}
              </CardBase>
              <Flex justifyContent="center" mt={4} gap={4}>
                <Button
                  leftIcon={<Icon as={BsArrowDownCircleFill} />}
                  colorScheme="red"
                  onClick={() => handleVote('downvote')}
                  variant="solid"
                >
                  {isAdmin ? 'Reprove' : 'Downvote'}
                </Button>
                <Button
                  leftIcon={<Icon as={BsArrowUpCircleFill} />}
                  colorScheme="green"
                  variant="solid"
                  onClick={() => handleVote('upvote')}
                  mr={2}
                >
                  {isAdmin ? 'Approve' : 'Upvote'}
                </Button>
              </Flex>
            </>
          )}

          {!isLoading && error && (
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

export default FeedbackVotingPage;

const TagAndNotesGuidelines = () => {
  return (
    <Box>
      <Text>
        <b>Tags</b> are used to help you find items. They should be used to describe the{' '}
        <b>item&apos;s appearance or function</b>.<br />
        Tags <b>should not contain any meta-information</b> about the item such as method of
        acquisition.
        <br />
        Tags <b>should not contain any word of the item&apos;s name</b>.
      </Text>
      <Text mt={4}>
        <b>Item Notes</b> are used to provide additional information about the item such as
        it&apos;s functions or effects. Please be sure to check the veracity of the information
        provided before upvoting it :)
      </Text>
    </Box>
  );
};
