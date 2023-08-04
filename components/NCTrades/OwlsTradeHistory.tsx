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
} from '@chakra-ui/react';
import { format } from 'date-fns';
import Link from 'next/link';
import { OwlsTrade, ItemData } from '../../types';

type Props = {
  item: ItemData;
  tradeHistory: OwlsTrade[] | null;
};

const OwlsTradeHistory = (props: Props) => {
  const { item, tradeHistory } = props;
  const color = item.color.rgb;

  if (!tradeHistory) return <Flex>Loading...</Flex>;

  return (
    <Flex flexFlow="column" maxH={300} overflow="auto" gap={3} px={1} w="100%">
      {tradeHistory.map((trade, i) => (
        <Card key={i}>
          <CardBody>
            <Heading size="sm" mb={3} opacity="0.75">
              {isValidDate(new Date(trade.ds)) && format(new Date(trade.ds), 'PPP')}
              {!isValidDate(new Date(trade.ds)) && 'Unknown Date'}
            </Heading>
            <Stack divider={<StackDivider />} spacing="3">
              <Box>
                <Heading size="xs" textTransform="uppercase" mb={2}>
                  Traded
                </Heading>
                <UnorderedList>
                  {trade.traded.split('+').map((traded, i) => (
                    <ListItem
                      key={i}
                      fontSize="xs"
                      bg={
                        isSameItem(traded, item)
                          ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                          : undefined
                      }
                    >
                      <Link href={getSearchLink(traded)} target="_blank">
                        {traded}
                      </Link>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>
              <Box>
                <Heading size="xs" textTransform="uppercase" mb={2}>
                  Traded For
                </Heading>
                <UnorderedList>
                  {trade.traded_for.split('+').map((traded, i) => (
                    <ListItem
                      key={i}
                      fontSize="xs"
                      bg={
                        isSameItem(traded, item)
                          ? `rgba(${color[0]},${color[1]}, ${color[2]},.4)`
                          : undefined
                      }
                    >
                      <Link href={getSearchLink(traded)} target="_blank">
                        {traded}
                      </Link>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>
              {trade.notes && (
                <Box>
                  <Heading size="xs" textTransform="uppercase">
                    Notes
                  </Heading>
                  <Text pt="2" fontSize="xs">
                    {trade.notes}
                  </Text>
                </Box>
              )}
            </Stack>
          </CardBody>
        </Card>
      ))}
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
