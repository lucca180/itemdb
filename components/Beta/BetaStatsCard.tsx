import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Flex, Icon, Heading, As, Center, Skeleton } from '@chakra-ui/react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';
import {
  CiBadgeDollar,
  CiCircleCheck,
  CiMicrochip,
  CiShoppingBasket,
  CiShoppingTag,
} from 'react-icons/ci';
import useSWR from 'swr';

const fetcher = (url: string) => axios.get(url).then((res) => res.data as BetaStats);

type BetaStats = {
  itemToProcess: number;
  itemsMissingInfo: number;
  itemsTotal: number;
  tradeQueue: number;
  feedbackVoting: number;
};

const intl = new Intl.NumberFormat();

const BetaStatsCard = () => {
  const t = useTranslations('BetaStats');
  const { data: stats, isLoading } = useSWR('/api/v1/beta', fetcher);

  return (
    <Center h="100%" w="100%">
      <Flex flexFlow="column" gap={5} w="100%" maxW="400px">
        <StatCard
          icon={CiShoppingBasket}
          value={!stats || isLoading ? null : intl.format(stats.itemsTotal)}
        >
          {t('items-in-db')}
        </StatCard>
        <StatCard
          icon={CiShoppingTag}
          value={
            !stats || isLoading ? null : (
              <>
                {(((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(
                  0
                )}
                %
              </>
            )
          }
        >
          {t('complete-items')}
        </StatCard>
        <StatCard
          icon={CiMicrochip}
          value={!stats || isLoading ? null : intl.format(stats.itemToProcess)}
        >
          {t('process-queue')}
        </StatCard>
        <StatCard
          icon={CiBadgeDollar}
          value={!stats || isLoading ? null : intl.format(stats.tradeQueue)}
        >
          <Link href="/feedback/trades">
            {t('trade-pricing-queue')} <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </StatCard>
        <StatCard
          icon={CiCircleCheck}
          value={!stats || isLoading ? null : intl.format(stats.feedbackVoting)}
        >
          <Link href="/feedback/vote">
            {t('feedback-voting-queue')} <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </StatCard>
      </Flex>
    </Center>
  );

  // return (
  //   <Flex flexFlow="column" mt={5} gap={3} w="100%" maxW="300px">
  //     <VStack justifyContent={'center'} alignItems="center" w="100%">
  //       <Text color="gray.300">{t('items-in-db')}</Text>
  //       <Progress w="100%" value={(stats.itemsTotal / 62000) * 100} />
  //       <Text fontSize="sm" textAlign={'center'}>
  //         {intl.format(stats.itemsTotal)}
  //       </Text>
  //     </VStack>
  //     <VStack justifyContent={'center'} alignItems="center" w="100%">
  //       <Text color="gray.300">{t('complete-items')}</Text>
  //       <Progress
  //         w="100%"
  //         value={((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100}
  //       />
  //       <Text fontSize="sm" textAlign={'center'}>
  //         {(((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(0)}%
  //       </Text>
  //     </VStack>
  //     <VStack justifyContent={'center'} alignItems="center" w="100%">
  //       <Text color="gray.300">{t('process-queue')}</Text>
  //       <Progress w="100%" value={(stats.itemToProcess / 500) * 100} />
  //       <Text fontSize="sm" textAlign={'center'}>
  //         {stats.itemToProcess}
  //       </Text>
  //     </VStack>
  //     <VStack justifyContent={'center'} alignItems="center" w="100%">
  //       <Text color="gray.300">
  //         <Link href="/feedback/trades">
  //           {t('trade-pricing-queue')} <ExternalLinkIcon verticalAlign="center" />
  //         </Link>
  //       </Text>
  //       <Progress w="100%" value={(stats.tradeQueue / 1000) * 100} />
  //       <Text fontSize="sm" textAlign={'center'}>
  //         {stats.tradeQueue}
  //       </Text>
  //     </VStack>
  //     <VStack justifyContent={'center'} alignItems="center" w="100%">
  //       <Text color="gray.300">
  //         <Link href="/feedback/vote">
  //           {t('feedback-voting-queue')} <ExternalLinkIcon verticalAlign="center" />
  //         </Link>
  //       </Text>
  //       <Progress w="100%" value={(stats.feedbackVoting / 1000) * 100} />
  //       <Text fontSize="sm" textAlign={'center'}>
  //         {stats.feedbackVoting}
  //       </Text>
  //     </VStack>
  //   </Flex>
  // );
};

export default BetaStatsCard;

type StatCardProps = {
  icon: As;
  value: React.ReactNode | null;
  children: React.ReactNode;
};

const StatCard = (props: StatCardProps) => {
  const hasValue = props.value !== null;
  return (
    <Flex alignItems={'center'} gap={5} bg="whiteAlpha.100" p={2} borderRadius={'sm'} w="100%">
      <Icon as={props.icon} boxSize={'52px'} />
      <Flex flexFlow={'column'} gap={1} w="100%">
        {hasValue && <Heading fontSize="1.7rem">{props.value}</Heading>}
        {!hasValue && <Skeleton height="1.3rem" width="70%" mb={1} />}
        <Heading color="gray.300" fontWeight={400} size={'xs'}>
          {props.children}
        </Heading>
      </Flex>
    </Flex>
  );
};
