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
  tradeQueue: number;
  feedbackVoting: number;
};

const intl = new Intl.NumberFormat();

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
        <Text color="gray.300">Items in the database</Text>
        <Progress w="100%" value={(stats.itemsTotal / 62000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {intl.format(stats.itemsTotal)}
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
        <Text color="gray.300">Process Queue</Text>
        <Progress w="100%" value={(stats.itemToProcess / 500) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.itemToProcess}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">
          <Link href="/feedback/trades">
            Trade Pricing Queue <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </Text>
        <Progress w="100%" value={(stats.tradeQueue / 1000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.tradeQueue}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">
          <Link href="/feedback/vote">
            Feedback Voting Queue <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </Text>
        <Progress w="100%" value={(stats.feedbackVoting / 1000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.feedbackVoting}
        </Text>
      </VStack>
    </Flex>
  );
};

export default BetaStatsCard;
