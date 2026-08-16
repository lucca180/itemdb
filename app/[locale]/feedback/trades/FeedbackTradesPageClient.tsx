'use client';

import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import { Alert, Box, Button, Center, Flex, Kbd, Spinner, Text } from '@chakra-ui/react';
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
  isNewAccount: boolean;
  target?: string;
  adminEditId?: string;
};

export function FeedbackTradesPageClient({
  shouldShowReminder,
  isNewAccount,
  target,
  adminEditId,
}: FeedbackTradesPageClientProps) {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [prevTrades, setPrev] = useState<TradeData[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeData>();
  const [isLoading, setIsLoading] = useState(!isNewAccount);
  const [error, setError] = useState<string>('');
  const [adminEditActive, setAdminEditActive] = useState(!!adminEditId);
  const popularItem = useRef<string | undefined>(undefined);
  const skippedTrades = useRef<string[]>([]);

  const isAdminEdit = adminEditActive && !!adminEditId && user?.isAdmin;

  const init = async () => {
    setIsLoading(true);
    setError('');
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

  const loadAdminTrade = async () => {
    if (!adminEditId) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/admin/trades/${adminEditId}`);
      setTrades([]);
      setCurrentTrade(res.data.trade as TradeData);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setCurrentTrade(undefined);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading || !user) return;

    if (adminEditActive && adminEditId && user.isAdmin) {
      void loadAdminTrade();
      return;
    }

    if (adminEditId && !adminEditActive) return;

    if (!isNewAccount) void init();
  }, [authLoading, user, isNewAccount, adminEditId, adminEditActive]);

  const handleSubmitAdminEdit = async (trade: TradeData) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.patch(`/api/admin/trades/${trade.trade_id}`, {
        items: trade.items,
      });

      if (!res.data.success) throw res.data;

      setAdminEditActive(false);
      setCurrentTrade(undefined);
      setTrades([]);
      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsLoading(false);
    }
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
    if (!trade || !user) return;

    if (isAdminEdit) return handleSubmitAdminEdit(trade);

    setIsLoading(true);

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
        {isNewAccount && (
          <Alert.Root status="info" variant="subtle" borderRadius="md">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('Feedback.trade-pricing-new-account-title')}</Alert.Title>
              <Alert.Description>
                {t.rich('Feedback.trade-pricing-new-account-txt', {
                  Link: (chunk) => <MainLink href="/feedback/vote">{chunk}</MainLink>,
                })}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        {!isNewAccount && !isLoading && currentTrade && (
          <>
            <FeedbackTrade
              hideQueueActions={!!isAdminEdit}
              hasUndo={!isAdminEdit && prevTrades.length > 0}
              handleUndo={isAdminEdit ? undefined : handleUndo}
              trade={currentTrade}
              handleSubmit={handleSubmit}
              handleSkip={isAdminEdit ? undefined : handleSkip}
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
        {!isNewAccount && isLoading && (
          <Center>
            <Spinner size="lg" />
          </Center>
        )}
        {!isNewAccount && !isLoading && !currentTrade && !error && (
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
            <Button onClick={isAdminEdit ? loadAdminTrade : init}>{t('General.try-again')}</Button>
          </Center>
        )}
      </Flex>
    </Flex>
  );
}
