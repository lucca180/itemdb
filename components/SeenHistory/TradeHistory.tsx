'use client';

import { Text, Flex, HStack, Box, Spinner, Tabs, Center } from '@chakra-ui/react';
import type { ItemData } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { SeenHistoryError } from './SeenHistoryError';
import { GATED_SWR_OPTIONS, SEEN_HISTORY_SWR_OPTIONS, unwrapRateLimit } from './seenHistoryRequest';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import TradeTable from '../Trades/TradeTable';
import { ContributeWall } from '../Utils/ContributeWall';
import { loadTradeHistory } from '@app/server/items/seenHistoryActions';

export type TradeHistoryProps = {
  item: ItemData;
};

export const TradeHistory = (props: TradeHistoryProps) => {
  const { item } = props;
  const format = useFormatter();
  const t = useTranslations();

  const {
    data: recentResult,
    error: recentError,
    isLoading: loading,
  } = useSWRImmutable(
    ['seen-history', 'trades', item.name, false],
    () => unwrapRateLimit(loadTradeHistory(item.name, false)),
    SEEN_HISTORY_SWR_OPTIONS
  );

  const {
    data: pricedResult,
    error: pricedError,
    isLoading: pricedLoading,
  } = useSWR(
    ['seen-history', 'trades', item.name, true],
    () => unwrapRateLimit(loadTradeHistory(item.name, true)),
    GATED_SWR_OPTIONS
  );

  const data = recentResult?.ok ? recentResult.data : null;
  const soldData = pricedResult?.ok ? pricedResult.data : null;
  const wall = pricedResult && !pricedResult.ok ? pricedResult.wall : null;

  return (
    <Flex flexFlow="column">
      <HStack
        justifyContent={'space-between'}
        mb={5}
        alignItems={'stretch'}
        bg="gray.800"
        p={2}
        borderRadius={'lg'}
      >
        <SeenHistoryStatusCard
          title={t('ItemPage.total-trade-lots')}
          status={data?.total}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.unique-owners')}
          status={data?.uniqueOwners}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.total-priced')}
          status={data?.priced}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.last-trade-lot')}
          status={
            data?.recent[0] &&
            `${format.dateTime(new Date(data.recent[0].addedAt), {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'america/los_angeles',
            })} NST`
          }
          loading={loading}
        />
      </HStack>
      <Flex flexFlow="column" bg="gray.800" p={2} borderRadius={'lg'} gap={2}>
        <Tabs.Root
          defaultValue="recent"
          variant="subtle"
          colorPalette="whiteAlpha"
          lazyMount
          unmountOnExit
        >
          <Tabs.List justifyContent="center" w="100%">
            <Tabs.Trigger value="recent">
              {t('ItemPage.latest-x-trades', {
                x: 40,
              })}
            </Tabs.Trigger>
            <Tabs.Trigger value="priced">
              {t('ItemPage.latest-x-with-price', {
                x: 40,
              })}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="recent" textAlign="left">
            {recentError && !loading && <SeenHistoryError error={recentError} />}
            {!loading && !recentError && (
              <Box maxH="500px" overflow="auto">
                {data?.recent.map((trade) => (
                  <TradeTable featuredItem={item} key={trade.trade_id} data={trade} showAdminEdit />
                ))}
              </Box>
            )}
            {!loading && !recentError && data && data.recent.length === 0 && (
              <Text textAlign="center" fontSize="xs" color="whiteAlpha.600">
                {t('ItemPage.no-trade-history')}
              </Text>
            )}
            {loading && (
              <Center>
                <Spinner />
              </Center>
            )}
          </Tabs.Content>
          <Tabs.Content value="priced" textAlign="left">
            {wall && <ContributeWall textType="ItemPage" color={item.color.hex} wall={wall} />}
            {pricedError && !wall && !pricedLoading && <SeenHistoryError error={pricedError} />}
            {!wall && !pricedError && soldData && (
              <Box maxH="500px" overflow="auto">
                {soldData.recent.map((trade) => (
                  <TradeTable featuredItem={item} key={trade.trade_id} data={trade} showAdminEdit />
                ))}
              </Box>
            )}
            {!wall && !pricedError && soldData && soldData.recent.length === 0 && (
              <Text textAlign="center" fontSize="xs" color="whiteAlpha.600">
                {t('ItemPage.no-trade-history')}
              </Text>
            )}
            {!wall && !soldData && pricedLoading && (
              <Center>
                <Spinner />
              </Center>
            )}
          </Tabs.Content>
        </Tabs.Root>
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.seen-history-psa')}
        </Text>
      </Flex>
    </Flex>
  );
};

export default TradeHistory;
