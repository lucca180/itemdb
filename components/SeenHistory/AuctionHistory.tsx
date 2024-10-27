import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  Th,
  Thead,
  Flex,
  HStack,
} from '@chakra-ui/react';
import React from 'react';
import { ItemAuctionData, ItemData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import useSWRImmutable from 'swr/immutable';

type Props = {
  data: ItemAuctionData[];
};

export type AuctionHistoryProps = {
  item: ItemData;
};

type AuctionHistoryResponse = {
  recent: ItemAuctionData[];
  total: number;
  sold: number;
  uniqueOwners: number;
};

async function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  const res = await axios.get(url, config);
  return res.data;
}

export const AuctionHistory = (props: AuctionHistoryProps) => {
  const { item } = props;
  const format = useFormatter();
  const t = useTranslations();

  const { data, isLoading: loading } = useSWRImmutable<AuctionHistoryResponse>(
    `/api/v1/items/${item.name}/auction`,
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
          title={t('ItemPage.total-auctions')}
          status={data?.total}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.total-sold')}
          status={data?.sold}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.unique-owners')}
          status={data?.uniqueOwners}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.last-new-auction')}
          status={`${format.dateTime(new Date(data?.recent?.[0]?.addedAt ?? 0), {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'america/los_angeles',
          })} NST`}
          loading={loading}
        />
      </HStack>
      <Flex flexFlow="column" bg="gray.800" p={2} borderRadius={'lg'} gap={2}>
        <Text textAlign={'center'} fontSize="md" fontWeight={'bold'}>
          {t('ItemPage.latest-x-auctions', {
            x: 20,
          })}
        </Text>
        <AuctionHistoryTable data={data?.recent ?? []} />
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.seen-history-psa')}
        </Text>
      </Flex>
    </Flex>
  );
};

export default AuctionHistory;

const AuctionHistoryTable = (props: Props) => {
  const { data: sortedData } = props;
  const t = useTranslations();

  return (
    <TableContainer
      minH={{ base: 100, md: 200 }}
      maxH={{ base: 200, md: 500 }}
      w="100%"
      maxW="1000"
      borderRadius="sm"
      overflowX="auto"
      overflowY="auto"
    >
      <Table h="100%" variant="striped" colorScheme="gray" size="sm" bg={'gray.600'}>
        <Thead>
          <Tr>
            <Th isNumeric>{t('ItemPage.last-known-price')}</Th>
            <Th>{t('ItemPage.time-left')}</Th>
            <Th>{t('ItemPage.sold-question')}</Th>
            <Th>{t('ItemPage.owner')}</Th>
            <Th>{t('ItemPage.first-seen-history')}</Th>
          </Tr>
        </Thead>
        <Tbody fontSize={'xs'} color="gray.200">
          {sortedData.map((auction, index) => (
            <AuctionItem key={auction.internal_id} auction={auction} index={index} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const AuctionItem = (props: { auction: ItemAuctionData; index: number }) => {
  const { auction } = props;
  const format = useFormatter();
  const t = useTranslations();

  return (
    <Tr key={auction.internal_id}>
      <Td>
        <Text>{format.number(auction.price)} NP</Text>
      </Td>
      <Td>
        <Text>
          {auction.isNF && '[NF]'} {auction.timeLeft}
        </Text>
      </Td>
      <Td>
        <Text>{auction.hasBuyer ? t('ItemPage.sold') : t('ItemPage.not-sold')}</Text>
      </Td>
      <Td>
        <Text>{auction.owner}</Text>
      </Td>
      <Td>
        <Text>
          {format.dateTime(new Date(auction.addedAt), {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'america/los_angeles',
          })}{' '}
          NST
        </Text>
      </Td>
    </Tr>
  );
};
