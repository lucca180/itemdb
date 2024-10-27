import { Text, Flex, HStack, Box } from '@chakra-ui/react';
import React from 'react';
import { ItemData, TradeData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import TradeTable from '../Trades/TradeTable';
import useSWRImmutable from 'swr/immutable';

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

  const { data, isLoading: loading } = useSWRImmutable<TradeHistoryResponse>(
    `/api/v1/items/${item.name}/trades`,
    fetcher
  );

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
        <Text textAlign={'center'} fontSize="md" fontWeight={'bold'}>
          {t('ItemPage.latest-x-trades', {
            x: 20,
          })}
        </Text>
        <Box maxH="500px" overflow={'auto'}>
          {data?.recent.map((t) => (
            <TradeTable featuredItem={item} key={t.trade_id} data={t} />
          ))}
        </Box>
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.seen-history-psa')}
        </Text>
      </Flex>
    </Flex>
  );
};

export default TradeHistory;
