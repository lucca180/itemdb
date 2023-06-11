import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Flex, VStack, Text, Progress } from '@chakra-ui/react';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type BetaStats = {
  itemProcess: number;
  itemToProcess: number;
  itemsMissingInfo: number;
  itemsTotal: number;
  tradePricing: number;
  tradeTotal: number;
};

const BetaStatsCard = () => {
  const [stats, setStats] = useState<BetaStats>();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const res = await axios('/api/v1/beta');
    setStats(res.data);
  };

  if (!stats) return null;

  return (
    <Flex flexFlow="column" mt={5} gap={3} w="100%" maxW="300px">
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">Items Missing</Text>
        <Progress w="100%" value={(stats.itemsTotal / 62000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          ~{62000 - stats.itemsTotal}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">Complete Items</Text>
        <Progress
          w="100%"
          value={((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100}
        />
        <Text fontSize="sm" textAlign={'center'}>
          {(((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(0)}%
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">
          <Link href="/feedback/trades">
            Trades to be priced <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </Text>
        <Progress w="100%" value={((stats.tradeTotal - stats.tradePricing) / 1000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.tradeTotal - stats.tradePricing} / {stats.tradeTotal}
        </Text>
      </VStack>
    </Flex>
  );
};

export default BetaStatsCard;
