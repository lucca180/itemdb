import { Box, Text, Divider, Flex } from '@chakra-ui/react';
import React from 'react';
import { ItemData, TradeData } from '../../types';
import { format } from 'date-fns';
import Image from 'next/image';
import { genItemKey } from '../../utils/utils';

type Props = {
  data: TradeData;
  featuredItem?: ItemData;
};

const intl = new Intl.NumberFormat();

const TradeTable = (props: Props) => {
  const { data, featuredItem } = props;
  return (
    <Flex flexFlow="column" w="100%" flex={1} mb={3}>
      <Flex flexFlow="column">
        <Box fontSize="xs" px={3} py={2}>
          <Text color="gray.200">
            <b>Lot {data.trade_id}</b> | Owned by {data.owner}
          </Text>
          <Text color="gray.300">Seen at {format(new Date(data.addedAt), 'PPP')}</Text>
        </Box>
        {data.items.map((item) => (
          <Flex
            px={3}
            py={2}
            gap={2}
            key={item.order}
            bg={
              featuredItem && genItemKey(featuredItem, true) === genItemKey(item, true)
                ? 'gray.700'
                : ''
            }
          >
            <Flex w={50} flexShrink="0" justifyContent="center" alignItems="center">
              <Image src={item.image} width={50} height={50} alt={item.name} />
            </Flex>
            <Flex flexFlow="column" justifyContent="center">
              <Text wordBreak={'break-word'} whiteSpace={'pre-line'} fontSize="sm">
                {item.name}
              </Text>
              {item.price && (
                <Text fontSize="xs" opacity="0.8">
                  {intl.format(item.price)} NP
                </Text>
              )}
              {data.priced && !item.price && (
                <Text fontSize="xs" opacity="0.8" fontStyle="italic">
                  Unspecified Price
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
        <Flex
          textAlign="center"
          fontSize="xs"
          wordBreak={'break-word'}
          whiteSpace={'pre-line'}
          flexFlow="column"
          p={2}
        >
          <b>Wishlist</b>
          <Text>{data.wishlist}</Text>
        </Flex>
      </Flex>
      <Divider mt={4} />
    </Flex>
  );
};

export default TradeTable;
