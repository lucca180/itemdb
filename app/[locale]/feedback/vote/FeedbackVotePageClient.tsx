'use client';

import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import {
  Accordion,
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import MainLink from '@components/Utils/MainLink';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BsArrowDownCircleFill, BsArrowUpCircleFill } from 'react-icons/bs';
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
          title={t('Feedback.voting')}
          chakra={{ bg: 'gray.700' }}
        >
          <Text>{t('Feedback.fds-pg-2')}</Text>
          <Accordion.Root collapsible multiple mt={4}>
            <Accordion.Item value="trade-pricing">
              <Accordion.ItemTrigger>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight={'bold'}>{t('Layout.trade-pricing')} </Text>
                </Box>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pb={4}>
                  <TradeGuidelines />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
          <Center mt={4} fontStyle="italic" fontSize="sm">
            {/* I love democracy - Sheev */}
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
          {shouldShowReminder && <NewPolicyReminder />}
          {isLoading && (
            <Center>
              <Spinner size="lg" />
            </Center>
          )}

          {!isLoading && !currentFeedback && !error && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('Feedback.thanks-for-helping-out-want-more')}</Text>
              <Button onClick={init}>{t('Feedback.yes-i-need-it')} (D)</Button>
              <Box>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {t('Feedback.vote-everything')}
                </Text>
                <Text fontSize="xs" color="gray.200" textAlign="center">
                  <MainLink href="/feedback/trades">
                    {t('Feedback.you-can-also-price-some-trades')}{' '}
                    <ExternalLinkIcon verticalAlign={'center'} />
                  </MainLink>
                </Text>
              </Box>
            </Center>
          )}

          {!isLoading && currentFeedback && !error && (
            <>
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
              <Flex justifyContent="center" flexFlow={{ base: 'column', md: 'row' }} mt={4} gap={4}>
                <Button colorPalette="red" onClick={() => handleVote('downvote')} variant="solid">
                  <Icon as={BsArrowDownCircleFill} />
                  {isAdmin ? t('Feedback.reprove') : t('Feedback.downvote')} (A)
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  {t('General.skip')} (S)
                </Button>
                {isAdmin && <Button onClick={onCanonicalOpen}>🏷️</Button>}
                <Button
                  colorPalette="green"
                  variant="solid"
                  onClick={() => handleVote('upvote')}
                  mr={2}
                >
                  <Icon as={BsArrowUpCircleFill} />
                  {isAdmin ? t('Feedback.approve') : t('Feedback.upvote')} (D)
                </Button>
              </Flex>
            </>
          )}

          {!isLoading && error && (
            <Center flexFlow="column" gap={4}>
              <Text>{t('General.something-went-wrong')} :(</Text>
              <Button onClick={init}>{t('General.try-again')}</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </>
  );
}
