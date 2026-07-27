'use client';

import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Center,
  EmptyState,
  Flex,
  HStack,
  Icon,
  Kbd,
  Separator,
  Spinner,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import MainLink from '@components/Utils/MainLink';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BsArrowDownCircleFill,
  BsArrowLeftRight,
  BsArrowUpCircleFill,
  BsCheckCircleFill,
  BsHandThumbsUp,
  BsQuestionCircleFill,
  BsXCircleFill,
} from 'react-icons/bs';
import type { IconType } from 'react-icons';
import CardBase from '@components/Card/CardBase';
import FeedbackItem from '@components/Feedback/FeedbackItem';
import { TradeGuidelines } from '@components/Feedback/TradeGuidelines';
import TradeTable from '@components/Trades/TradeTable';
import { Feedback, TradeData } from '@types';
import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { NewPolicyReminder } from '@components/Feedback/NewPolicyReminder';

const ReportFeedbackModal = dynamic(() => import('@components/Modal/ReportFeedbackModal'), {
  ssr: false,
});

const CanonicalTradeModal = dynamic(() => import('@components/Modal/CanonicalTradeModal'), {
  ssr: false,
});

const AUTO_PRICE_UID = 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1';

type FeedbackVotePageClientProps = {
  shouldShowReminder: boolean;
  target?: string;
  wishlist?: string;
  order?: string;
};

type VoteCriterion = {
  titleKey:
    | 'vote-criteria-accept-title'
    | 'vote-criteria-reject-title'
    | 'vote-criteria-skip-title';
  descKey: 'vote-criteria-accept-desc' | 'vote-criteria-reject-desc' | 'vote-criteria-skip-desc';
  shortcut: string;
  icon: IconType;
  colorPalette: 'green' | 'red' | 'gray';
};

const VOTE_CRITERIA: VoteCriterion[] = [
  {
    titleKey: 'vote-criteria-accept-title',
    descKey: 'vote-criteria-accept-desc',
    shortcut: 'D',
    icon: BsCheckCircleFill,
    colorPalette: 'green',
  },
  {
    titleKey: 'vote-criteria-reject-title',
    descKey: 'vote-criteria-reject-desc',
    shortcut: 'A',
    icon: BsXCircleFill,
    colorPalette: 'red',
  },
  {
    titleKey: 'vote-criteria-skip-title',
    descKey: 'vote-criteria-skip-desc',
    shortcut: 'S',
    icon: BsQuestionCircleFill,
    colorPalette: 'gray',
  },
];

export function FeedbackVotePageClient({
  shouldShowReminder,
  target,
  wishlist,
  order,
}: FeedbackVotePageClientProps) {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [votedCount, setVotedCount] = useState(0);
  const skippedFeedbacks = useRef<number[]>([]);
  const {
    open: isCanonicalOpen,
    onOpen: onCanonicalOpen,
    onClose: onCanonicalClose,
  } = useDisclosure();

  const isAdmin = user?.role === 'ADMIN';

  const init = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.get('/api/feedback/getLatest', {
        params: {
          itemName: target,
          wishlist,
          order,
          skipList: skippedFeedbacks.current.join(','),
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
  }, [order, target, wishlist]);

  const handleSkip = useCallback(async () => {
    if (!currentFeedback) {
      await init();
      return;
    }

    setError('');

    skippedFeedbacks.current.push(currentFeedback.feedback_id);

    const newFeedbacks = feedbacks.filter((f) => f.feedback_id !== currentFeedback.feedback_id);

    if (!newFeedbacks.length) {
      setFeedbacks([]);
      setCurrentFeedback(undefined);
      await init();
      return;
    }

    setFeedbacks(newFeedbacks);
    setCurrentFeedback(newFeedbacks[0]);
  }, [currentFeedback, feedbacks, init]);

  const handleVote = useCallback(
    async (action: 'upvote' | 'downvote') => {
      setError('');
      setIsLoading(true);
      try {
        if (!currentFeedback) {
          await init();
          return;
        }

        const res = await axios.post('/api/feedback/vote', {
          action,
          feedback_id: currentFeedback?.feedback_id,
        });

        if (res.data.success) {
          setVotedCount((count) => count + 1);
          const newFeedbacks = feedbacks.filter(
            (f) => f.feedback_id !== currentFeedback?.feedback_id
          );

          if (!newFeedbacks.length) {
            return init();
          }

          setFeedbacks(newFeedbacks);
          setCurrentFeedback(newFeedbacks[0]);
        } else throw new Error(res.data.message);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentFeedback, feedbacks, init]
  );

  useEffect(() => {
    if (!authLoading) {
      void init();
    }
  }, [authLoading, init]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const targetName = (e.target as HTMLElement | null)?.nodeName;

      if (['INPUT', 'TEXTAREA'].includes(targetName ?? '') || isLoading) return;

      if (e.key.toLowerCase() === 'd') {
        void handleVote('upvote');
      }

      if (e.key.toLowerCase() === 'a') {
        void handleVote('downvote');
      }

      if (e.key.toLowerCase() === 's') {
        void handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleSkip, handleVote, isLoading]);

  const feedbackTypeLabel =
    currentFeedback?.type === 'tradePrice'
      ? t('Feedback.vote-type-trade')
      : t('Feedback.vote-type-item');

  return (
    <>
      {isOpen && currentFeedback && (
        <ReportFeedbackModal feedback={currentFeedback} isOpen={isOpen} onClose={onClose} />
      )}
      {isCanonicalOpen && currentFeedback && (
        <CanonicalTradeModal
          trade={currentFeedback.parsed?.content.trade}
          isOpen={isCanonicalOpen}
          onClose={onCanonicalClose}
          refresh={init}
        />
      )}
      <Flex
        mt={8}
        gap={6}
        alignItems={{ base: 'center', md: 'flex-start' }}
        flexFlow={{ base: 'column', md: 'row' }}
      >
        <CardBase
          chakraWrapper={{ flex: 2 }}
          title={t('Feedback.how-to-vote')}
          chakra={{ bg: 'gray.700' }}
        >
          <Alert.Root status="info" variant="subtle" borderRadius="md" mb={4} size="sm">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description fontSize="xs">{t('Feedback.vote-review-tip')}</Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <Text fontSize="sm" color="gray.200">
            {t('Feedback.vote-how-to')}
          </Text>

          <VStack align="stretch" gap={2} mt={4}>
            {VOTE_CRITERIA.map((criterion) => (
              <Flex
                key={criterion.titleKey}
                gap={3}
                p={3}
                borderRadius="md"
                bg={
                  criterion.colorPalette === 'gray'
                    ? 'whiteAlpha.100'
                    : `${criterion.colorPalette}.950`
                }
                borderWidth="1px"
                borderColor={
                  criterion.colorPalette === 'gray'
                    ? 'whiteAlpha.300'
                    : `${criterion.colorPalette}.700`
                }
                align="flex-start"
              >
                <Center
                  boxSize={9}
                  borderRadius="full"
                  bg={
                    criterion.colorPalette === 'gray'
                      ? 'whiteAlpha.200'
                      : `${criterion.colorPalette}.800`
                  }
                  flexShrink={0}
                  mt={0.5}
                >
                  <Icon
                    as={criterion.icon}
                    boxSize={5}
                    color={
                      criterion.colorPalette === 'gray'
                        ? 'gray.200'
                        : `${criterion.colorPalette}.300`
                    }
                  />
                </Center>
                <Box flex="1" minW={0}>
                  <HStack gap={2} mb={1}>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={
                        criterion.colorPalette === 'gray'
                          ? 'gray.100'
                          : `${criterion.colorPalette}.200`
                      }
                    >
                      {t(`Feedback.${criterion.titleKey}`)}
                    </Text>
                    <Kbd size="sm" bg="blackAlpha.400">
                      {criterion.shortcut}
                    </Kbd>
                  </HStack>
                  <Text fontSize="xs" color="gray.300" lineHeight="tall">
                    {t(`Feedback.${criterion.descKey}`)}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>

          <Separator my={4} borderColor="whiteAlpha.200" />

          <Accordion.Root collapsible multiple>
            <Accordion.Item value="trade-pricing" border="none">
              <Accordion.ItemTrigger
                px={3}
                py={2}
                borderRadius="md"
                bg="whiteAlpha.100"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight="bold" fontSize="sm">
                    {t('Feedback.vote-guidelines-title')}
                  </Text>
                </Box>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pt={3} pb={1}>
                  <TradeGuidelines forVoting />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
        </CardBase>

        <Flex
          flex="1"
          flexFlow="column"
          alignItems="center"
          justifyContent="flex-start"
          h="100%"
          w="100%"
          gap={3}
        >
          {shouldShowReminder && <NewPolicyReminder />}
          {isLoading && (
            <Center py={16}>
              <Spinner size="lg" />
            </Center>
          )}

          {!isLoading && !currentFeedback && !error && (
            <CardBase
              chakraWrapper={{ w: '100%' }}
              title={t('Feedback.feedback-voting')}
              chakra={{ bg: 'gray.700' }}
            >
              <EmptyState.Root py={6}>
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <Icon as={BsHandThumbsUp} />
                  </EmptyState.Indicator>
                  <VStack textAlign="center" gap={1}>
                    <EmptyState.Title>{t('Feedback.vote-done-title')}</EmptyState.Title>
                    <EmptyState.Description>
                      {t('Feedback.vote-done-description')}
                    </EmptyState.Description>
                  </VStack>
                  <HStack gap={3} flexWrap="wrap" justify="center">
                    <Button onClick={init} colorPalette="green">
                      {t('Feedback.yes-i-need-it')}
                      <Kbd ml={2} bg="blackAlpha.400">
                        D
                      </Kbd>
                    </Button>
                    <Button asChild variant="outline">
                      <MainLink href="/feedback/trades">
                        {t('Feedback.you-can-also-price-some-trades')}{' '}
                        <ExternalLinkIcon verticalAlign="center" />
                      </MainLink>
                    </Button>
                  </HStack>
                  <Text fontSize="xs" color="gray.400" textAlign="center">
                    {t('Feedback.vote-everything')}
                  </Text>
                </EmptyState.Content>
              </EmptyState.Root>
            </CardBase>
          )}

          {!isLoading && currentFeedback && !error && (
            <>
              <HStack w="100%" justify="space-between" flexWrap="wrap" gap={2} px={1}>
                <HStack gap={2}>
                  <Badge
                    colorPalette={currentFeedback.type === 'tradePrice' ? 'orange' : 'cyan'}
                    variant="subtle"
                  >
                    {feedbackTypeLabel}
                  </Badge>
                  {currentFeedback.user_id === AUTO_PRICE_UID && (
                    <Badge colorPalette="blue" variant="subtle">
                      Auto
                    </Badge>
                  )}
                </HStack>
                <Badge colorPalette="gray" variant="outline">
                  {t('Feedback.vote-queue-voted', { count: votedCount })}
                </Badge>
              </HStack>

              <CardBase
                chakraWrapper={{ flex: 1, width: '100%' }}
                title={t('Feedback.feedback-voting')}
                chakra={{ bg: 'gray.700' }}
              >
                {currentFeedback.type === 'tradePrice' && (
                  <TradeTable
                    onReport={onOpen}
                    isAuto={currentFeedback.user_id === AUTO_PRICE_UID}
                    data={currentFeedback.parsed?.content.trade as TradeData}
                  />
                )}
                {currentFeedback.type === 'itemChange' && (
                  <FeedbackItem
                    itemNotes={currentFeedback.parsed?.content.itemNotes as string | undefined}
                    itemTags={currentFeedback.parsed?.content.itemTags as string[]}
                    item_iid={currentFeedback.subject_id as number}
                  />
                )}
              </CardBase>

              <Box
                w="100%"
                p={4}
                borderRadius="md"
                bg="gray.700"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                boxShadow="md"
              >
                <Flex
                  justifyContent="center"
                  flexFlow={{ base: 'column', sm: 'row' }}
                  gap={3}
                  w="100%"
                >
                  <Button
                    colorPalette="red"
                    onClick={() => handleVote('downvote')}
                    variant="solid"
                    size="lg"
                    flex={{ sm: 1 }}
                  >
                    <Icon as={BsArrowDownCircleFill} />
                    {isAdmin ? t('Feedback.reprove') : t('Feedback.vote-reject')}
                    <Kbd ml={2} bg="blackAlpha.400">
                      A
                    </Kbd>
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="lg"
                    flex={{ sm: 1 }}
                    borderColor="whiteAlpha.400"
                  >
                    <Icon as={BsArrowLeftRight} />
                    {t('General.skip')}
                    <Kbd ml={2} bg="blackAlpha.400">
                      S
                    </Kbd>
                  </Button>
                  {isAdmin && (
                    <Button onClick={onCanonicalOpen} size="lg" variant="subtle">
                      🏷️
                    </Button>
                  )}
                  <Button
                    colorPalette="green"
                    variant="solid"
                    onClick={() => handleVote('upvote')}
                    size="lg"
                    flex={{ sm: 1 }}
                  >
                    <Icon as={BsArrowUpCircleFill} />
                    {isAdmin ? t('Feedback.approve') : t('Feedback.vote-accept')}
                    <Kbd ml={2} bg="blackAlpha.400">
                      D
                    </Kbd>
                  </Button>
                </Flex>
                <Text fontSize="xs" color="gray.400" textAlign="center" mt={3}>
                  {t('Feedback.vote-shortcuts')}
                </Text>
              </Box>
            </>
          )}

          {!isLoading && error && (
            <Center flexFlow="column" gap={4} py={10}>
              <Text>{t('General.something-went-wrong')} :(</Text>
              <Button onClick={init}>{t('General.try-again')}</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </>
  );
}
