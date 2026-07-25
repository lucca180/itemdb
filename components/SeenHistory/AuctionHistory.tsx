'use client';

import { Badge, Table, Text, Flex, HStack, Tabs, Spinner } from '@chakra-ui/react';
import type { ItemAuctionData, ItemData } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import { ContributeWall } from '../Utils/ContributeWall';
import { loadAuctionHistory } from '@app/server/items/seenHistoryActions';

/** Re-check contribute gate / sold auctions periodically while the modal is open. */
const GATED_REFRESH_MS = 60_000;

type Props = {
  data: ItemAuctionData[];
};

export type AuctionHistoryProps = {
  item: ItemData;
};

export const AuctionHistory = (props: AuctionHistoryProps) => {
  const { item } = props;
  const t = useTranslations();

  const {
    data: recentResult,
    error: recentError,
    isLoading: loading,
  } = useSWRImmutable(['seen-history', 'auction', item.name, false], () =>
    loadAuctionHistory(item.name, false)
  );

  const {
    data: soldResult,
    error: soldError,
    isLoading: soldLoading,
  } = useSWR(
    ['seen-history', 'auction', item.name, true],
    () => loadAuctionHistory(item.name, true),
    { refreshInterval: GATED_REFRESH_MS, revalidateOnFocus: true }
  );

  const data = recentResult?.ok ? recentResult.data : null;
  const soldData = soldResult?.ok ? soldResult.data : null;
  const wall = soldResult && !soldResult.ok ? soldResult.wall : null;

  return (
    <Flex flexFlow="column">
      <HStack
        justifyContent={'space-between'}
        mb={2}
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
          status={`${data?.sold} (${data?.sold ? ((data.sold / data.total) * 100).toFixed(0) : 0}%)`}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.unique-owners')}
          status={data?.uniqueOwners}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.median-price')}
          status={data?.priceMedian ?? '???'}
          loading={loading}
          isNP
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.sold-median-price')}
          status={soldData?.priceMedian ?? '???'}
          loading={!wall && soldLoading}
          isNP
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
              {t('ItemPage.latest-x-auctions', {
                x: 40,
              })}
            </Tabs.Trigger>
            <Tabs.Trigger value="sold">
              {t('ItemPage.latest-x-sold', {
                x: 40,
              })}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="recent" pb={0} px={1}>
            {recentError && !loading && (
              <Text textAlign="center" fontSize="xs" color="red.300">
                {t('General.error')}
              </Text>
            )}
            {!loading && !recentError && <AuctionHistoryTable data={data?.recent ?? []} />}
            {loading && <Spinner />}
          </Tabs.Content>
          <Tabs.Content value="sold" pb={0} px={1}>
            {wall && <ContributeWall textType="ItemPage" color={item.color.hex} wall={wall} />}
            {soldError && !wall && !soldLoading && (
              <Text textAlign="center" fontSize="xs" color="red.300">
                {t('General.error')}
              </Text>
            )}
            {!wall && !soldError && soldData && (
              <AuctionHistoryTable data={soldData.recent ?? []} />
            )}
            {!wall && !soldData && soldLoading && <Spinner />}
          </Tabs.Content>
        </Tabs.Root>
        <Text textAlign={'center'} fontSize={'xs'} mt={1} color="whiteAlpha.600">
          {t('ItemPage.auction-disclaimer')}
        </Text>
        <Text textAlign={'center'} fontSize={'xs'} mt={1} color="whiteAlpha.600">
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
    <Table.ScrollArea
      minH={{ base: 100, md: 200 }}
      maxH={{ base: 200, md: 500 }}
      w="100%"
      maxW="1000px"
      borderRadius="md"
    >
      <Table.Root h="100%" variant="outline" size="md" bg="gray.600" striped>
        <Table.Header>
          <Table.Row whiteSpace="wrap">
            <Table.ColumnHeader textAlign="center" fontSize="xs" maxW="150px">
              {t('ItemPage.last-known-price')}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" fontSize="xs">
              {t('ItemPage.time-left')}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" fontSize="xs">
              {t('ItemPage.has-a-buyer')}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" fontSize="xs">
              {t('ItemPage.owner')}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" fontSize="xs">
              {t('ItemPage.last-seen')}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body fontSize="xs">
          {sortedData.map((auction, index) => (
            <AuctionItem key={auction.internal_id} auction={auction} index={index} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

const AuctionItem = (props: { auction: ItemAuctionData; index: number }) => {
  const { auction } = props;
  const format = useFormatter();
  const t = useTranslations();

  return (
    <Table.Row>
      <Table.Cell>
        <Text>{format.number(auction.price)} NP</Text>
      </Table.Cell>
      <Table.Cell>
        <Text>
          {auction.flag && `[${auction.flag}] `}
          {auction.timeLeft}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Badge colorPalette={auction.hasBuyer ? 'green' : 'gray'} size="xs">
          {auction.bidCount != null
            ? t('ItemPage.bids-count', { x: auction.bidCount })
            : auction.hasBuyer
              ? t('ItemPage.has-bids')
              : t('ItemPage.no-bids')}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Text>{auction.owner}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text>
          {format.dateTime(new Date(auction.addedAt), {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'america/los_angeles',
          })}{' '}
          NST
        </Text>
      </Table.Cell>
    </Table.Row>
  );
};
