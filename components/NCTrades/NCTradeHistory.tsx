import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  ListItem,
  Stack,
  StackDivider,
  Text,
  UnorderedList,
  Center,
  Link,
  Button,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { ItemData, NCTradeReport, LebronTrade } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { UTCDate } from '@date-fns/utc';
import { useMemo } from 'react';
import { tradeReportToLebronTrade } from '../../pages/mall/report';

type Props = {
  item: ItemData;
  ncTrades: LebronTrade[] | null;
  tradeHistory: NCTradeReport[] | null;
};

const NCTradeHistory = (props: Props) => {
  const t = useTranslations();
  const { item } = props;

  const tradeHistory = useMemo(() => {
    const trades: LebronTrade[] = [...(props.ncTrades ?? [])];

    props.tradeHistory?.forEach((trade) => {
      trades.push(tradeReportToLebronTrade(trade));
    });

    return getUniqueTrades(trades).sort((a, b) => {
      const dateA = new Date(a.tradeDate);
      const dateB = new Date(b.tradeDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [props.tradeHistory, props.ncTrades]);

  if (!tradeHistory)
    return (
      <Center>
        <Text fontSize="sm" opacity="0.75">
          {t('Layout.loading')}...
        </Text>
      </Center>
    );

  if (!tradeHistory.length)
    return (
      <Center flexFlow="column" gap={2}>
        <Text fontSize="sm" opacity="0.75">
          {t('ItemPage.no-trade-history')}.
        </Text>
        <Button as={NextLink} prefetch={false} href="/mall/report" size={'xs'}>
          {t('ItemPage.report-your-nc-trades')}
        </Button>
      </Center>
    );

  return (
    <Flex flexFlow="column" maxH={300} overflow="auto" gap={3} w="100%">
      <Flex maxW="500px" flexFlow="column" gap={3}>
        {tradeHistory.map((trade, i) => (
          <NCTradeCard key={i} trade={trade} item={item} />
        ))}
        <Text fontSize="xs" textAlign="center" mt={2} color="whiteAlpha.600">
          {t.rich('ItemPage.owls-credits', {
            Link: (chunks) => (
              <Link href="/articles/lebron" target="_blank" color="whiteAlpha.800">
                {chunks}
              </Link>
            ),
          })}
        </Text>
      </Flex>
    </Flex>
  );
};

export default NCTradeHistory;

const isValidDate = (date: Date) => date instanceof Date && !isNaN(date.valueOf());
const isSameItem = (tradeStr: string, item: ItemData) =>
  tradeStr.toLowerCase().includes(item.name.toLowerCase());

const getSearchLink = (tradeStr: string) => {
  const itemName = tradeStr.trim().replaceAll(/\(?\d+-?\d+\)?$|\(?\d+\)?$/gm, '');
  return `/search?s=${encodeURIComponent(itemName.trim())}`;
};

type NCTradeCardProps = {
  trade: LebronTrade;
  item?: ItemData;
  color?: number[];
};

export const NCTradeCard = (props: NCTradeCardProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { trade, item } = props;
  const color: number[] = item?.color.rgb ?? [71, 178, 248];

  return (
    <Card bg={'blackAlpha.500'} textAlign={'left'} borderRadius={'xl'}>
      <CardBody>
        <Heading size="sm" mb={3} opacity="0.75">
          {isValidDate(new Date(trade.tradeDate)) &&
            format.dateTime(new UTCDate(trade.tradeDate), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'utc',
            })}
          {!isValidDate(new Date(trade.tradeDate)) && t('General.unknown-date')}
        </Heading>
        <Stack divider={<StackDivider />} spacing="3">
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded')}
            </Heading>
            <UnorderedList>
              {trade.itemsSent.split('+').map((traded, i) => (
                <ListItem p={1} key={i} fontSize="xs">
                  <Link
                    p={1}
                    borderRadius="md"
                    bg={
                      item && isSameItem(traded, item)
                        ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                        : undefined
                    }
                    href={item && isSameItem(traded, item) ? '#' : getSearchLink(traded)}
                    target="_blank"
                  >
                    {traded}
                  </Link>
                </ListItem>
              ))}
            </UnorderedList>
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded-for')}
            </Heading>
            <UnorderedList>
              {trade.itemsReceived.split('+').map((traded, i) => (
                <ListItem p={1} key={i} fontSize="xs">
                  <Link
                    p={1}
                    borderRadius="md"
                    bg={
                      item && isSameItem(traded, item)
                        ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                        : undefined
                    }
                    href={item && isSameItem(traded, item) ? '#' : getSearchLink(traded)}
                    target="_blank"
                  >
                    {traded}
                  </Link>
                </ListItem>
              ))}
            </UnorderedList>
          </Box>
          {trade.notes && (
            <Box>
              <Heading size="xs" textTransform="uppercase">
                {t('ItemPage.notes')}
              </Heading>
              <Text pt="2" fontSize="xs">
                {trade.notes}
              </Text>
            </Box>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

const getUniqueTrades = (trades: LebronTrade[]) => {
  const uniqueTrades = new Map<string, LebronTrade>();

  trades.forEach((trade) => {
    const key = `${trade.itemsSent}-${trade.itemsReceived}-${trade.tradeDate}`;
    if (!uniqueTrades.has(key)) {
      uniqueTrades.set(key, trade);
    }
  });

  return Array.from(uniqueTrades.values());
};
