import {
  Icon,
  Flex,
  HStack,
  IconButton,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Center,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ItemData, ItemLastSeen, PriceData } from '../../types';
import ChartComponent from '../Charts/PriceChart';
import { AiOutlineAreaChart, AiOutlineTable } from 'react-icons/ai';
import PriceTable from './PriceTable';
import { format, formatDistanceToNow } from 'date-fns';
import { MinusIcon } from '@chakra-ui/icons';
import CardBase from '../Card/CardBase';
import { MdMoneyOff } from 'react-icons/md';

type Props = {
  item: ItemData;
  prices: PriceData[];
  lastSeen: ItemLastSeen;
};

const intl = new Intl.NumberFormat();

const ItemPriceCard = (props: Props) => {
  const { item, prices, lastSeen } = props;
  const [displayState, setDisplay] = useState('table');
  const [priceDiff, setDiff] = useState<number | null>(null);
  const isNoTrade = item.status?.toLowerCase() === 'no trade';

  const color = item.color.rgb;

  useEffect(() => {
    if (prices.length >= 2) {
      const diff = (prices.at(0)?.value ?? 0) - (prices.at(1)?.value ?? 0);
      setDiff(diff);
    }
  }, [prices]);

  if (isNoTrade)
    return (
      <CardBase color={color} title="Price Overview">
        <Center>
          <Icon as={MdMoneyOff} boxSize="100px" opacity={0.4} />
        </Center>
        <Text textAlign="center">This item is not tradeable.</Text>
      </CardBase>
    );

  return (
    <CardBase color={color} title="Price Overview">
      <Flex gap={4} flexFlow="column">
        <Flex gap={3} flexFlow="column">
          <Flex
            flexFlow={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'inherit', md: 'center' }}
          >
            <Stat flex="initial" textAlign="center" minW="20%">
              {item.price.inflated && (
                <Text fontWeight="bold" color="red.300">
                  Inflation
                </Text>
              )}
              {item.price.value && <StatNumber>{intl.format(item.price.value)} NP</StatNumber>}
              {!item.price.value && <StatNumber>??? NP</StatNumber>}
              {item.price.addedAt && (
                <StatLabel>on {format(new Date(item.price.addedAt), 'PP')}</StatLabel>
              )}
              {!item.price.addedAt && <StatHelpText>No Info</StatHelpText>}
              {priceDiff !== null && (
                <StatHelpText>
                  {!!priceDiff && <StatArrow type={priceDiff > 0 ? 'increase' : 'decrease'} />}
                  {priceDiff === 0 && <MinusIcon mr={1} boxSize="16px" />}
                  {intl.format(priceDiff)} NP
                </StatHelpText>
              )}
            </Stat>
            <Flex flexFlow="column" flex="1">
              {prices.length > 0 && (
                <>
                  <HStack ml="auto" mr={2} mb={2} gap={0}>
                    {displayState === 'table' && (
                      <IconButton
                        onClick={() => setDisplay('chart')}
                        size="sm"
                        aria-label="Chart"
                        icon={<AiOutlineAreaChart />}
                      />
                    )}
                    {displayState === 'chart' && (
                      <IconButton
                        onClick={() => setDisplay('table')}
                        size="sm"
                        aria-label="Table"
                        icon={<AiOutlineTable />}
                      />
                    )}
                  </HStack>
                  {displayState === 'chart' && <ChartComponent color={item.color} data={prices} />}
                  {displayState === 'table' && <PriceTable data={prices} />}
                </>
              )}
              {prices.length == 0 && (
                <Flex justifyContent="center" alignItems="center" minH={150}>
                  <Text fontSize="xs" color="gray.200">
                    We don&apos;t have enough price data
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
          <HStack justifyContent={{ base: 'space-between', md: 'space-around' }} textAlign="center">
            <Stat flex="initial">
              <StatLabel>Last SW</StatLabel>
              <StatHelpText>
                {lastSeen.sw &&
                  formatDistanceToNow(new Date(lastSeen.sw), {
                    addSuffix: true,
                  })}
                {!lastSeen.sw && 'Never'}
              </StatHelpText>
            </Stat>
            <Stat flex="initial">
              <StatLabel>Last TP</StatLabel>
              <StatHelpText>
                {lastSeen.tp &&
                  formatDistanceToNow(new Date(lastSeen.tp), {
                    addSuffix: true,
                  })}
                {!lastSeen.tp && 'Never'}
              </StatHelpText>
            </Stat>
            <Stat flex="initial">
              <StatLabel>Last Auction</StatLabel>
              <StatHelpText>
                {lastSeen.auction &&
                  formatDistanceToNow(new Date(lastSeen.auction), {
                    addSuffix: true,
                  })}
                {!lastSeen.auction && 'Never'}
              </StatHelpText>
            </Stat>
            <Stat flex="initial">
              <StatLabel>Last Restock</StatLabel>
              <StatHelpText>
                {!lastSeen.restock && !item.findAt.restockShop && 'Does not restock'}
                {lastSeen.restock &&
                  formatDistanceToNow(new Date(lastSeen.restock), {
                    addSuffix: true,
                  })}
                {!lastSeen.restock && item.findAt.restockShop && 'Never'}
              </StatHelpText>
            </Stat>
          </HStack>
        </Flex>
      </Flex>
    </CardBase>
  );
};

export default ItemPriceCard;
