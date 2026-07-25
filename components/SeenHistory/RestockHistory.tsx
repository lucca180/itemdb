'use client';

import { Table, Text, Flex, HStack, Spinner, Center } from '@chakra-ui/react';
import type { ItemData, ItemRestockData } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import { SeenHistoryStatusCard } from './SeenHistoryStatusCard';
import { loadRestockHistory } from '@app/server/items/seenHistoryActions';

type Props = {
  data: ItemRestockData[];
};

export type RestockHistoryProps = {
  item: ItemData;
};

export const RestockHistory = (props: RestockHistoryProps) => {
  const { item } = props;
  const format = useFormatter();
  const t = useTranslations();

  const {
    data,
    error,
    isLoading: loading,
  } = useSWRImmutable(['seen-history', 'restock', item.name], () => loadRestockHistory(item.name));

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
        {!loading && !error && <RestockHistoryTable data={data?.recent ?? []} />}
        {error && !loading && (
          <Text textAlign="center" fontSize="xs" color="red.300">
            {t('General.error')}
          </Text>
        )}
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
    <Table.ScrollArea
      minH={{ base: 100, md: 200 }}
      maxH={{ base: 200, md: 500 }}
      w="100%"
      maxW="1000"
      borderRadius="sm"
    >
      <Table.Root h="100%" variant="line" colorPalette="gray" size="sm" bg="gray.600" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('General.price')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('ItemPage.units-in-stock')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('ItemPage.seen-at')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body fontSize="xs" color="gray.200">
          {sortedData.map((restock, index) => (
            <RestockItem key={restock.internal_id} restock={restock} index={index} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

const RestockItem = (props: { restock: ItemRestockData; index: number }) => {
  const { restock } = props;
  const format = useFormatter();

  return (
    <Table.Row>
      <Table.Cell>
        <Text>{format.number(restock.price)} NP</Text>
      </Table.Cell>
      <Table.Cell>
        <Text>{restock.stock}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text>
          {format.dateTime(new Date(restock.addedAt), {
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
