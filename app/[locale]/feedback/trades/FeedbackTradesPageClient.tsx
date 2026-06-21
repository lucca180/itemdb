'use client';

import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import { Box, Button, Center, Flex, Kbd, Spinner, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import CardBase from '@components/Card/CardBase';
import FeedbackTrade from '@components/Feedback/FeedbackTrade';
import { TradeGuidelines } from '@components/Feedback/TradeGuidelines';
import MainLink from '@components/Utils/MainLink';
import { TradeData } from '@types';
import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import { NewPolicyReminder } from '@components/Feedback/NewPolicyReminder';

type FeedbackTradesPageClientProps = {
  shouldShowReminder: boolean;
  target?: string;
};

export function FeedbackTradesPageClient({
  shouldShowReminder,
  target,
}: FeedbackTradesPageClientProps) {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [prevTrades, setPrev] = useState<TradeData[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const popularItem = useRef<string | undefined>(undefined);
  const skippedTrades = useRef<string[]>([]);

  const init = async () => {
    setIsLoading(true);
    const res = await axios.get('/api/v1/trades/pricefy', {
      params: {
        itemName: popularItem.current ?? target,
        skipList: skippedTrades.current.join(','),
      },
    });

    const data = res.data as { trades: TradeData[]; popularItem: string | null };

    popularItem.current = data.popularItem ?? undefined;

    setTrades(data.trades);
    setCurrentTrade(data.trades[0]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      void init();
    }
  }, [authLoading, user]);

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
      <Flex flex="2" flexFlow={{ base: 'column-reverse', md: 'column' }} h="100%" w="100%" gap={4}>
        {shouldShowReminder && <NewPolicyReminder />}
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
                Kbd: (chunk) => <Kbd bg="whiteAlpha.200">{chunk}</Kbd>,
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
                <MainLink href="/feedback/vote">
                  {t('Feedback.you-can-also-vote-some-suggestions')}{' '}
                  <ExternalLinkIcon verticalAlign={'center'} />
                </MainLink>
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
  );
}
