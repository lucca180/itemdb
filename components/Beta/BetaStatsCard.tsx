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
        <Text color="gray.300">Items Added</Text>
        <Progress w="100%" value={(stats.itemsTotal / 60000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.itemsTotal}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">Items Completed</Text>
        <Progress w="100%" value={((stats.itemsTotal-stats.itemsMissingInfo) / stats.itemsTotal) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {(stats.itemsTotal-stats.itemsMissingInfo)}/{stats.itemsTotal}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">Data Waiting Processing</Text>
        <Progress w="100%" value={(stats.itemToProcess / stats.itemProcess)} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.itemToProcess}/{stats.itemProcess}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">
          <Link href="/feedback/trades">
            Trades Priced <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </Text>
        <Progress w="100%" value={(stats.tradePricing / stats.tradeTotal) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.tradePricing}/{stats.tradeTotal}
        </Text>
      </VStack>
    </Flex>
  );
};

export default BetaStatsCard;
