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
} from '@chakra-ui/react';
import { format } from 'date-fns';
import NextLink from 'next/link';
import { OwlsTrade, ItemData } from '../../types';

type Props = {
  item: ItemData;
  tradeHistory: OwlsTrade[] | null;
};

const OwlsTradeHistory = (props: Props) => {
  const { item, tradeHistory } = props;
  const color = item.color.rgb;

  if (!tradeHistory)
    return (
      <Center>
        <Text fontSize="sm" opacity="0.75">
          Loading...
        </Text>
      </Center>
    );

  if (!tradeHistory.length)
    return (
      <Center flexFlow="column">
        <Text fontSize="sm" opacity="0.75">
          No trade history found
        </Text>
        <Text fontSize="xs" color="whiteAlpha.600">
          NC Trade data provided by{' '}
          <Link href="/Owls" as={NextLink} color="whiteAlpha.700" isExternal>
            Owls
          </Link>
        </Text>
      </Center>
    );

  return (
    <Flex flexFlow="column" maxH={300} overflow="auto" gap={3} px={1} w="100%">
      {tradeHistory.map((trade, i) => (
        <Card key={i} bg={`rgba(${color[0]},${color[1]}, ${color[2]},.35)`}>
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
                      <NextLink href={getSearchLink(traded)} target="_blank">
                        {traded}
                      </NextLink>
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
      <Center>
        <Text fontSize="xs" color="whiteAlpha.600">
          NC Trade data provided by{' '}
          <Link href="/Owls" as={NextLink} color="whiteAlpha.700" isExternal>
            Owls
          </Link>
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
