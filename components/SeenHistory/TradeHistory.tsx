import { Text, Flex, HStack, Box, Spinner, Tabs, Center } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { ContributeWallData, ItemData, TradeData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import TradeTable from '../Trades/TradeTable';
import { TradeRelistingDisclaimer } from '@components/Trades/TradeRelistingDisclaimer';
import useSWRImmutable from 'swr/immutable';
import { ContributeWall } from '../Utils/ContributeWall';

export type TradeHistoryProps = {
  item: ItemData;
};

type TradeHistoryResponse = {
  recent: TradeData[];
  total: number;
  uniqueOwners: number;
  priced: number;
};

async function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  const res = await axios.get(url, config);
  return res.data;
}

export const TradeHistory = (props: TradeHistoryProps) => {
  const { item } = props;
  const format = useFormatter();
  const t = useTranslations();
  const [wall, setWall] = React.useState<ContributeWallData | null>(null);
  const [soldData, setSoldData] = React.useState<TradeHistoryResponse | null>(null);

  const { data, isLoading: loading } = useSWRImmutable<TradeHistoryResponse>(
    `/api/v1/items/${item.name}/trades`,
    fetcher
  );

  const init = async () => {
    setWall(null);
    try {
      const res = await axios.get(`/api/v1/items/${item.name}/trades?priced=true`);

      setSoldData(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error);

        if (error.response?.status === 403) {
          setWall(error.response?.data);
          console.error(error.response?.data);
        }
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, []);

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
          status={`${
            !data?.recent?.[0]?.addedAt
              ? ''
              : format.dateTime(new Date(data.recent[0].addedAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'america/los_angeles',
                })
          } NST`}
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
            {!loading && (
              <Box maxH="500px" overflow="auto">
                {data?.recent.map((trade) => (
                  <TradeTable featuredItem={item} key={trade.trade_id} data={trade} />
                ))}
                {data && <TradeRelistingDisclaimer trades={data.recent} />}
              </Box>
            )}
            {!loading && data && data.recent.length === 0 && (
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
            {!wall && soldData && (
              <Box maxH="500px" overflow="auto">
                {soldData.recent.map((trade) => (
                  <TradeTable featuredItem={item} key={trade.trade_id} data={trade} />
                ))}
              </Box>
            )}
            {!wall && soldData && soldData.recent.length === 0 && (
              <Text textAlign="center" fontSize="xs" color="whiteAlpha.600">
                {t('ItemPage.no-trade-history')}
              </Text>
            )}
            {!wall && !soldData && (
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
