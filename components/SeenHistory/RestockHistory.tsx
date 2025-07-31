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
  Spinner,
  Center,
} from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemRestockData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import axios, { AxiosRequestConfig } from 'axios';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import useSWRImmutable from 'swr/immutable';

type Props = {
  data: ItemRestockData[];
};

export type RestockHistoryProps = {
  item: ItemData;
};

type RestockHistoryResponse = {
  recent: ItemRestockData[];
  appearances: number;
  totalStock: number;
};

async function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  const res = await axios.get(url, config);
  return res.data;
}

export const RestockHistory = (props: RestockHistoryProps) => {
  const { item } = props;
  const format = useFormatter();
  const t = useTranslations();

  const { data, isLoading: loading } = useSWRImmutable<RestockHistoryResponse>(
    `/api/v1/items/${item.name}/restock`,
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
          title={t('ItemPage.unique-restocks')}
          status={data?.appearances}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.total-units-stocked')}
          status={data?.totalStock}
          loading={loading}
        />
        <SeenHistoryStatusCard
          title={t('ItemPage.last-seen-stock')}
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
          {t('ItemPage.latest-x-restocks', {
            x: 40,
          })}
        </Text>
        {!loading && <RestockHistoryTable data={data?.recent ?? []} />}
        {loading && (
          <Center>
            <Spinner />
          </Center>
        )}
        <Text textAlign={'center'} fontSize={'xs'} mt={3}>
          {t('ItemPage.seen-history-psa')}
        </Text>
      </Flex>
    </Flex>
  );
};

export default RestockHistory;

const RestockHistoryTable = (props: Props) => {
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
            <Th>{t('General.price')}</Th>
            <Th>{t('ItemPage.units-in-stock')}</Th>
            <Th>{t('ItemPage.seen-at')}</Th>
          </Tr>
        </Thead>
        <Tbody fontSize={'xs'} color="gray.200">
          {sortedData.map((restock, index) => (
            <RestockItem key={restock.internal_id} restock={restock} index={index} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const RestockItem = (props: { restock: ItemRestockData; index: number }) => {
  const { restock } = props;
  const format = useFormatter();

  return (
    <Tr key={restock.internal_id}>
      <Td>
        <Text>{format.number(restock.price)} NP</Text>
      </Td>
      <Td>
        <Text>{restock.stock}</Text>
      </Td>
      <Td>
        <Text>
          {format.dateTime(new Date(restock.addedAt), {
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
