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
import { OwlsTrade, ItemData, NCTradeReport } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { UTCDate } from '@date-fns/utc';
import { filterMostRecentNc } from '@utils/ncTradePricing';
import { mean } from 'simple-statistics';
import { useMemo } from 'react';
import { tradeReportToOwlsTrade } from '../../pages/mall/report';

type Props = {
  item: ItemData;
  owlsTrades: OwlsTrade[] | null;
  tradeHistory: NCTradeReport[] | null;
};

const OwlsTradeHistory = (props: Props) => {
  const t = useTranslations();
  const { item } = props;

  const tradeHistory = useMemo(() => {
    const trades: OwlsTrade[] = [...(props.owlsTrades ?? [])];

    props.tradeHistory?.forEach((trade) => {
      trades.push(tradeReportToOwlsTrade(trade));
    });

    return getUniqueOwlsTrades(trades).sort((a, b) => {
      const dateA = new Date(a.ds);
      const dateB = new Date(b.ds);
      return dateB.getTime() - dateA.getTime();
    });
  }, [props.tradeHistory, props.owlsTrades]);

  // const avgValue = tradeHistory ? getAvgValue(tradeHistory, item) : null;

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
    <Flex
      flexFlow="column"
      alignItems={'center'}
      maxH={300}
      overflow="auto"
      gap={3}
      px={1}
      w="100%"
    >
      {/* {avgValue && (
        <Center>
          <Flex
            flexFlow={'column'}
            bg="rgba(214, 188, 250, 0.16)"
            p={1}
            borderRadius={'lg'}
            textAlign={'center'}
            fontSize={'sm'}
            maxW="175px"
            gap={1}
          >
            <Text fontSize="xs" color="whiteAlpha.700">
              {t('Owls.average-value')}*
            </Text>
            <Text fontSize="md" fontWeight={'bold'}>
              {t('Owls.x-caps', { x: avgValue?.value })}
            </Text>
            <Text fontSize={'xs'} color="whiteAlpha.700" sx={{ textWrap: 'balance' }}>
              {t.rich('Owls.based-on-x-trades', {
                b: (chunk) => <b>{chunk}</b>,
                x: avgValue?.usedCount,
              })}
            </Text>
          </Flex>
        </Center>
      )} */}

      <Flex maxW="600px" flexFlow="column" gap={3}>
        {tradeHistory.map((trade, i) => (
          <OwlsTradeCard key={i} trade={trade} item={item} />
        ))}
      </Flex>
      {/* <Center flexFlow="column" gap={1} borderRadius={'lg'} p={1}>
        {avgValue && (
          <Text fontSize={'xs'} color="whiteAlpha.600" textAlign={'center'} maxW="700px">
            {t('Owls.avg-value-disclaimer')}
          </Text>
        )}
      </Center> */}
    </Flex>
  );
};

export default OwlsTradeHistory;

const isValidDate = (date: Date) => date instanceof Date && !isNaN(date.valueOf());
const isSameItem = (tradeStr: string, item: ItemData) =>
  tradeStr.toLowerCase().includes(item.name.toLowerCase());

const getSearchLink = (tradeStr: string) => {
  const itemName = tradeStr.trim().replaceAll(/\(?\d+-?\d+\)?$|\(?\d+\)?$/gm, '');
  return `/search?s=${encodeURIComponent(itemName.trim())}`;
};

type OwlsTradeCardProps = {
  trade: OwlsTrade;
  item?: ItemData;
  color?: number[];
};

export const OwlsTradeCard = (props: OwlsTradeCardProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { trade, item } = props;
  const color: number[] = item?.color.rgb ?? [71, 178, 248];

  return (
    <Card bg={'blackAlpha.500'} textAlign={'left'}>
      <CardBody>
        <Heading size="sm" mb={3} opacity="0.75">
          {isValidDate(new Date(trade.ds)) &&
            format.dateTime(new UTCDate(trade.ds), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'utc',
            })}
          {!isValidDate(new Date(trade.ds)) && t('General.unknown-date')}
        </Heading>
        <Stack divider={<StackDivider />} spacing="3">
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded')}
            </Heading>
            <UnorderedList>
              {trade.traded.split('+').map((traded, i) => (
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
              {trade.traded_for.split('+').map((traded, i) => (
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAvgValue = (tradeHistory: OwlsTrade[], item: ItemData) => {
  let filteredTrades = filterMostRecentNc(tradeHistory);
  if (!filteredTrades.length && tradeHistory.length > 3) filteredTrades = tradeHistory;

  if (!filteredTrades.length) return null;

  const values = filteredTrades
    .map((trade) => {
      const targetItem =
        trade.traded.split('+').find((traded) => isSameItem(traded, item)) ||
        trade.traded_for.split('+').find((traded) => isSameItem(traded, item));

      if (!targetItem) return undefined;

      const values =
        targetItem
          .match(/\((\d+)(?:-(\d+))?\)/)
          ?.slice(1)
          .map((value) => parseInt(value))
          .filter((x) => !isNaN(x)) ?? [];

      if (values.length === 0) return undefined;

      return values;
    })
    .filter((value) => value !== undefined)
    .flat();

  const filteredValues = removeOutliers(values);

  if (!filteredValues.length) return null;

  const mostRecent = filteredTrades[0].ds;
  const meanValue = mean(filteredValues);

  const minVal = Math.floor(meanValue);
  const maxVal = Math.ceil(meanValue);

  let finalVal = '';
  if (minVal === maxVal) finalVal = minVal.toString();
  else finalVal = `${minVal}-${maxVal}`;

  return {
    value: finalVal,
    timestamp: new Date(mostRecent).getTime(),
    usedCount: filteredTrades.length,
  };
};

const removeOutliers = (data: number[]) => {
  const sorted = data.sort((a, b) => a - b);
  const q1 = quartile(sorted, 0.25);
  const q3 = quartile(sorted, 0.75);

  const iqr = q3 - q1;

  return sorted.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);
};

const quartile = (sorted: number[], q: number) => {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

const getUniqueOwlsTrades = (trades: OwlsTrade[]) => {
  const uniqueTrades = new Map<string, OwlsTrade>();

  trades.forEach((trade) => {
    const key = `${trade.traded}-${trade.traded_for}-${trade.ds}`;
    if (!uniqueTrades.has(key)) {
      uniqueTrades.set(key, trade);
    }
  });

  return Array.from(uniqueTrades.values());
};
