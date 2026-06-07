'use client';

/** Trade preview card for the mall report flow (Pages Router). */
import { Box, Card, Heading, List, Stack, StackSeparator, Text, Link } from '@chakra-ui/react';
import { ItemData, LebronTrade } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { UTCDate } from '@date-fns/utc';
import {
  getTradeItemSearchLink,
  isSameTradeItem,
  isValidTradeDate,
} from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';

type NCTradeCardProps = {
  trade: LebronTrade;
  item?: ItemData;
  color?: number[];
};

export const NCTradeCard = (props: NCTradeCardProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { trade, item } = props;
  const color: number[] = item?.color.rgb ?? props.color ?? [71, 178, 248];

  return (
    <Card.Root bg="blackAlpha.500" textAlign="left" borderRadius="xl">
      <Card.Body>
        <Heading size="sm" mb={3} opacity="0.75">
          {isValidTradeDate(new Date(trade.tradeDate)) &&
            format.dateTime(new UTCDate(trade.tradeDate), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'utc',
            })}
          {!isValidTradeDate(new Date(trade.tradeDate)) && t('General.unknown-date')}
        </Heading>
        <Stack separator={<StackSeparator />} gap="3">
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded')}
            </Heading>
            <List.Root as="ul" gap={1} ps={4}>
              {trade.itemsSent.split('+').map((traded, i) => (
                <List.Item p={1} key={i} fontSize="xs">
                  <Link
                    p={1}
                    borderRadius="md"
                    bg={
                      item && isSameTradeItem(traded, item)
                        ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                        : undefined
                    }
                    href={
                      item && isSameTradeItem(traded, item) ? '#' : getTradeItemSearchLink(traded)
                    }
                    target="_blank"
                  >
                    {traded}
                  </Link>
                </List.Item>
              ))}
            </List.Root>
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded-for')}
            </Heading>
            <List.Root as="ul" gap={1} ps={4}>
              {trade.itemsReceived.split('+').map((traded, i) => (
                <List.Item p={1} key={i} fontSize="xs">
                  <Link
                    p={1}
                    borderRadius="md"
                    bg={
                      item && isSameTradeItem(traded, item)
                        ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                        : undefined
                    }
                    href={
                      item && isSameTradeItem(traded, item) ? '#' : getTradeItemSearchLink(traded)
                    }
                    target="_blank"
                  >
                    {traded}
                  </Link>
                </List.Item>
              ))}
            </List.Root>
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
      </Card.Body>
    </Card.Root>
  );
};
