'use client';

import { Box, Card, Heading, Link, List, Stack, StackSeparator, Text } from '@chakra-ui/react';
import { UTCDate } from '@date-fns/utc';
import { useFormatter, useTranslations } from 'next-intl';
import { Link as I18nLink } from '@i18n/navigation';
import {
  getTradeItemSearchLink,
  isValidTradeDate,
} from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';
import type { LebronTrade } from '@types';

type Props = {
  trade: LebronTrade;
  itemName?: string;
  colorRgb?: number[];
};

const isSameTradeItemName = (tradeStr: string, itemName: string) =>
  tradeStr.toLowerCase().includes(itemName.toLowerCase());

export function NCTradeHistoryCard({ trade, itemName, colorRgb }: Props) {
  const t = useTranslations();
  const format = useFormatter();
  const color = colorRgb ?? [71, 178, 248];
  const date = new UTCDate(Number(trade.tradeDate));
  const tradeDateMs = isValidTradeDate(date) ? date.getTime() : null;

  return (
    <Card.Root bg="blackAlpha.500" textAlign="left" borderRadius="xl">
      <Card.Body>
        <Heading size="sm" mb={3} opacity="0.75">
          {tradeDateMs != null &&
            format.dateTime(new Date(tradeDateMs), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'utc',
            })}
          {tradeDateMs == null && t('General.unknown-date')}
        </Heading>
        <Stack separator={<StackSeparator />} gap="3">
          <Box>
            <Heading size="xs" textTransform="uppercase" mb={2}>
              {t('ItemPage.traded')}
            </Heading>
            <List.Root as="ul" gap={1} ps={4}>
              {trade.itemsSent.split('+').map((traded, i) => (
                <List.Item p={1} key={i} fontSize="xs">
                  {itemName && isSameTradeItemName(traded, itemName) ? (
                    <Text
                      p={1}
                      borderRadius="md"
                      bg={`rgba(${color[0]},${color[1]}, ${color[2]},.4)`}
                    >
                      {traded}
                    </Text>
                  ) : (
                    <Link asChild p={1} borderRadius="md">
                      <I18nLink href={getTradeItemSearchLink(traded)} target="_blank">
                        {traded}
                      </I18nLink>
                    </Link>
                  )}
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
                  {itemName && isSameTradeItemName(traded, itemName) ? (
                    <Text
                      p={1}
                      borderRadius="md"
                      bg={`rgba(${color[0]},${color[1]}, ${color[2]},.4)`}
                    >
                      {traded}
                    </Text>
                  ) : (
                    <Link asChild p={1} borderRadius="md">
                      <I18nLink href={getTradeItemSearchLink(traded)} target="_blank">
                        {traded}
                      </I18nLink>
                    </Link>
                  )}
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
}
