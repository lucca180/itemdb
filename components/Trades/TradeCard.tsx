import { Badge, Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData, TradeData } from '../../types';
import TradeTable from './TradeTable';

type Props = {
  trades: TradeData[];
  item?: ItemData;
  isLoading?: boolean;
};

const TradeCard = (props: Props) => {
  const { trades, item, isLoading } = props;
  const color = item?.color.rgb;
  const colorString = color ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)` : 'gray.600';

  return (
    <Flex
      // flex={1}
      // height="100%"
      maxH="500px"
      borderTopRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
    >
      <Box p={2} textAlign="center" fontWeight="bold" bg={colorString}>
        Trade History <Badge>{trades.length}</Badge>
      </Box>
      <Box bg="gray.600" boxShadow="md" overflow="auto" borderBottomRadius="md">
        {isLoading && (
          <>
            <Skeleton h="150px" />
          </>
        )}
        {!isLoading && (
          <>
            {trades.map((t) => (
              <TradeTable featuredItem={item} key={t.trade_id} data={t} />
            ))}
            {trades.length === 0 && (
              <Text p={3} textAlign="center" fontSize="sm">
                We haven&apos;t seen this item at the trading post yet :(
              </Text>
            )}
          </>
        )}
      </Box>
    </Flex>
  );
};

export default TradeCard;
