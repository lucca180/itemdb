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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Spinner,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { ContributeWallData, ItemAuctionData, ItemData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import useSWRImmutable from 'swr/immutable';
import { ContributeWall } from '../Utils/ContributeWall';

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
  const [wall, setWall] = React.useState<ContributeWallData | null>(null);
  const [soldData, setSoldData] = React.useState<AuctionHistoryResponse | null>(null);
  const { data, isLoading: loading } = useSWRImmutable<AuctionHistoryResponse>(
    `/api/v1/items/${item.name}/auction`,
    fetcher
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setWall(null);
    try {
      const res = await axios.get(`/api/v1/items/${item.name}/auction?sold=true`);

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
              {t('ItemPage.latest-x-auctions', {
                x: 40,
              })}
            </Tab>
            <Tab>
              {t('ItemPage.latest-x-sold', {
                x: 40,
              })}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {!loading && <AuctionHistoryTable data={data?.recent ?? []} />}
              {loading && <Spinner />}
            </TabPanel>
            <TabPanel>
              {wall && <ContributeWall textType="ItemPage" color={item.color.hex} wall={wall} />}
              {!wall && soldData && <AuctionHistoryTable data={soldData.recent ?? []} />}
              {!wall && !soldData && <Spinner />}
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.auction-disclaimer')}
        </Text>
        <Text textAlign={'center'} fontSize={'xs'} mt={1}>
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
      maxH={{ base: 200, md: 425 }}
      w="100%"
      maxW="1000px"
      borderRadius="sm"
      overflowX="auto"
      overflowY="auto"
    >
      <Table h="100%" variant="striped" colorScheme="gray" size="sm" bg={'gray.600'}>
        <Thead>
          <Tr whiteSpace={'wrap'}>
            <Th textAlign={'center'} fontSize={'0.6rem'}>
              {t('ItemPage.last-known-price')}
            </Th>
            <Th textAlign={'center'} fontSize={'0.6rem'}>
              {t('ItemPage.time-left')}
            </Th>
            <Th textAlign={'center'} fontSize={'0.6rem'}>
              {t('ItemPage.has-a-buyer')}
            </Th>
            <Th textAlign={'center'} fontSize={'0.6rem'}>
              {t('ItemPage.owner')}
            </Th>
            <Th textAlign={'center'} fontSize={'0.6rem'}>
              {t('ItemPage.first-seen-history')}
            </Th>
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
        <Text color={auction.hasBuyer ? 'green.200' : 'undefined'}>
          {auction.hasBuyer ? t('General.yes') : t('General.no')}
        </Text>
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
