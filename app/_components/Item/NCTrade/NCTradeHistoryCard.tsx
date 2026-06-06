import { Box, Card, Heading, Link, List, Stack, StackSeparator, Text } from '@chakra-ui/react';
import { UTCDate } from '@date-fns/utc';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import {
  getTradeItemSearchLink,
  isSameTradeItem,
  isValidTradeDate,
} from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';
import type { ItemData, LebronTrade } from '@types';

type Props = {
  trade: LebronTrade;
  item?: ItemData;
};

export async function NCTradeHistoryCard({ trade, item }: Props) {
  const t = await getTranslations();
  const format = await getFormatter();
  const color: number[] = item?.color.rgb ?? [71, 178, 248];

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
                  {item && isSameTradeItem(traded, item) ? (
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
                  {item && isSameTradeItem(traded, item) ? (
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
