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
import { OwlsTrade, ItemData } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { UTCDate } from '@date-fns/utc';

type Props = {
  item: ItemData;
  tradeHistory: OwlsTrade[] | null;
};

const OwlsTradeHistory = (props: Props) => {
  const t = useTranslations();
  const { item, tradeHistory } = props;

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
        <Button as={NextLink} prefetch={false} href="/owls/report" size={'xs'}>
          {t('ItemPage.report-your-nc-trades')}
        </Button>
        <Text fontSize="xs" color="whiteAlpha.600">
          {t.rich('ItemPage.owls-credits', {
            Link: (chunk) => (
              <Link href="/articles/owls" as={NextLink} color="whiteAlpha.700" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </Text>
      </Center>
    );

  return (
    <Flex flexFlow="column" maxH={300} overflow="auto" gap={3} px={1} w="100%">
      {tradeHistory.map((trade, i) => (
        <OwlsTradeCard key={i} trade={trade} item={item} />
      ))}
      <Center flexFlow="column" gap={3}>
        <Button as={NextLink} prefetch={false} href="/owls/report" size={'xs'}>
          {t('ItemPage.report-your-nc-trades')}
        </Button>
        <Text fontSize="xs" color="whiteAlpha.600">
          {t.rich('ItemPage.owls-credits', {
            Link: (chunk) => (
              <Link href="/owls" as={NextLink} color="whiteAlpha.700" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </Text>
      </Center>
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
    <Card bg={`rgba(${color[0]},${color[1]}, ${color[2]},.35)`} textAlign={'left'}>
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
                <ListItem
                  key={i}
                  fontSize="xs"
                  bg={
                    item && isSameItem(traded, item)
                      ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                      : undefined
                  }
                >
                  <NextLink href={getSearchLink(traded)} target="_blank">
                    {traded}
                  </NextLink>
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
                <ListItem
                  key={i}
                  fontSize="xs"
                  bg={
                    item && isSameItem(traded, item)
                      ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                      : undefined
                  }
                >
                  <NextLink href={getSearchLink(traded)} target="_blank">
                    {traded}
                  </NextLink>
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
