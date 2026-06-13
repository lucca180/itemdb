'use client';

import { Badge, Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import { useRef } from 'react';
import type { ItemData, TradeData } from '@types';
import TradeTable from '@components/Trades/TradeTable';
import { useTranslations } from 'next-intl';
import { ViewportList } from 'react-viewport-list';

type Props = {
  trades: TradeData[];
  item?: ItemData;
  isLoading?: boolean;
};

const TradeCard = ({ trades, item, isLoading }: Props) => {
  const t = useTranslations();
  const color = item?.color.rgb;
  const colorString = color ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)` : 'gray.600';
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <Flex maxH="500px" borderTopRadius="md" overflow="hidden" flexFlow="column" boxShadow="sm">
      <Box p={2} textAlign="center" fontWeight="bold" bg={colorString}>
        {t('ItemPage.trade-history')}{' '}
        <Badge>
          {trades.length} {trades.length === 20 && '+'}
        </Badge>
      </Box>
      <Box bg="gray.600" boxShadow="md" overflow="auto" borderBottomRadius="md" ref={ref}>
        {isLoading && <Skeleton h="150px" />}
        {!isLoading && trades.length > 0 && (
          <>
            <ViewportList viewportRef={ref} items={trades} overscan={2} initialPrerender={3}>
              {(trade) => <TradeTable featuredItem={item} key={trade.trade_id} data={trade} />}
            </ViewportList>
          </>
        )}
        {!isLoading && trades.length === 0 && (
          <Text p={3} textAlign="center" fontSize="sm">
            {t('ItemPage.no-trade-history-card')} :(
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export default TradeCard;
