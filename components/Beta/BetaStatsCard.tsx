import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Flex, VStack, Text, Progress } from '@chakra-ui/react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('BetaStats');
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
        <Text color="gray.300">{t('items-in-db')}</Text>
        <Progress w="100%" value={(stats.itemsTotal / 62000) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {intl.format(stats.itemsTotal)}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">{t('complete-items')}</Text>
        <Progress
          w="100%"
          value={((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100}
        />
        <Text fontSize="sm" textAlign={'center'}>
          {(((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(0)}%
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">{t('process-queue')}</Text>
        <Progress w="100%" value={(stats.itemToProcess / 500) * 100} />
        <Text fontSize="sm" textAlign={'center'}>
          {stats.itemToProcess}
        </Text>
      </VStack>
      <VStack justifyContent={'center'} alignItems="center" w="100%">
        <Text color="gray.300">
          <Link href="/feedback/trades">
            {t('trade-pricing-queue')} <ExternalLinkIcon verticalAlign="center" />
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
            {t('feedback-voting-queue')} <ExternalLinkIcon verticalAlign="center" />
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
