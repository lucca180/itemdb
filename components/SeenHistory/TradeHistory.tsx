import {
  Text,
  Flex,
  HStack,
  Box,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Center,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { ContributeWallData, ItemData, TradeData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import TradeTable from '../Trades/TradeTable';
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

  useEffect(() => {
    init();
  }, []);

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
        <Tabs align="center" variant="soft-rounded" colorScheme="gray" isLazy>
          <TabList>
            <Tab>
              {t('ItemPage.latest-x-trades', {
                x: 40,
              })}
            </Tab>
            <Tab>
              {t('ItemPage.latest-x-with-price', {
                x: 40,
              })}
            </Tab>
          </TabList>
          <TabPanels textAlign={'left'}>
            <TabPanel>
              {!loading && (
                <Box maxH="500px" overflow={'auto'}>
                  {data?.recent.map((t) => (
                    <TradeTable featuredItem={item} key={t.trade_id} data={t} />
                  ))}
                </Box>
              )}
              {!loading && data && data.recent.length === 0 && (
                <Text textAlign={'center'} fontSize={'xs'} color="whiteAlpha.600">
                  {t('ItemPage.no-trade-history')}
                </Text>
              )}
              {loading && (
                <Center>
                  <Spinner />
                </Center>
              )}
            </TabPanel>
            <TabPanel>
              {wall && <ContributeWall textType="ItemPage" color={item.color.hex} wall={wall} />}
              {!wall && soldData && (
                <Box maxH="500px" overflow={'auto'}>
                  {soldData.recent.map((t) => (
                    <TradeTable featuredItem={item} key={t.trade_id} data={t} />
                  ))}
                </Box>
              )}
              {!wall && soldData && soldData.recent.length === 0 && (
                <Text textAlign={'center'} fontSize={'xs'} color="whiteAlpha.600">
                  {t('ItemPage.no-trade-history')}
                </Text>
              )}
              {!wall && !soldData && (
                <Center>
                  <Spinner />
                </Center>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.seen-history-psa')}
        </Text>
      </Flex>
    </Flex>
  );
};

export default TradeHistory;
