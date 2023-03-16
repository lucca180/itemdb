import { Box, Flex, FormControl, FormHelperText, Text } from '@chakra-ui/react';
import { TradeData } from '../../types';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import CustomNumberInput from '../Input/CustomNumber';

type Props = {
  trade?: TradeData;
  onChange?: (newValue: TradeData) => void;
};

type TradeItems = TradeData['items'][0];

const FeedbackTrade = (props: Props) => {
  const { trade } = props;

  const handleChange = (item: TradeItems, index: number) => {
    if(!trade) return;
    const tempTrade = { ...trade };
    tempTrade.items[index] = item;
    props.onChange?.(tempTrade);
  };

  return (
    <CardBase chakraWrapper={{ flex: 1 }} title="Trade Pricing" chakra={{ bg: 'gray.700' }}>
      <Flex flexFlow="column" gap={6}>
        <Flex
          textAlign="center"
          fontSize="sm"
          wordBreak={'break-word'}
          whiteSpace={'pre-line'}
          flexFlow="column"
          p={2}
        >
          <b>Wishlist</b>
          <Text>{trade?.wishlist}</Text>
        </Flex>

        {trade?.items.map((item) => (
          <ItemTrade
            onChange={(item) => handleChange(item, item.order)}
            item={item}
            key={item.order}
          />
        ))}
      </Flex>
    </CardBase>
  );
};

export default FeedbackTrade;

type ItemTradeProps = {
  item: TradeItems;
  onChange?: (newValue: TradeItems) => void;
};

const ItemTrade = (props: ItemTradeProps) => {
  const { item } = props;

  const handleChange = (val: string) => {
    const tempItem = { ...item };
    tempItem.price = val ? parseInt(val) : null;

    props.onChange?.(tempItem);
  };

  return (
    <Flex gap={3}>
      <Box>
        <Image src={item.image} width={80} height={80} alt={item.name} />
      </Box>
      <Flex flex={1} flexFlow="column" justifyContent="center" gap={1}>
        <Text wordBreak={'break-word'} whiteSpace={'pre-line'} fontSize="sm">
          {item.name}
        </Text>
        <FormControl>
          <CustomNumberInput
            wrapperProps={{
              variant: 'filled',
              size: 'sm',
              placeholder: 'NP Price',
            }}
            inputProps={{
              placeholder: 'NP Price',
              textAlign: 'left',
              name: item.trade_id + item.name + item.order,
            }}
            value={item.price?.toString()}
            onChange={(val) => handleChange(val)}
          />
          <FormHelperText fontSize="xs">Leave empty if price is not specified</FormHelperText>
        </FormControl>
      </Flex>
    </Flex>
  );
};
