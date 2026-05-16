'use client';

import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Flex, Icon, Heading, Center, Skeleton } from '@chakra-ui/react';
import axios from 'axios';
import { useFormatter, useTranslations } from 'next-intl';
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

const BetaStatsCard = () => {
  const t = useTranslations();
  const format = useFormatter();
  const { data: stats, isLoading } = useSWR('/api/v1/beta', fetcher);

  return (
    <Center h="100%" w="100%">
      <Flex flexFlow="column" gap={5} w="100%" maxW="400px">
        <StatCard
          icon={CiShoppingBasket}
          value={!stats || isLoading ? null : format.number(stats.itemsTotal)}
        >
          {t('BetaStats.items-in-db')}
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
          {t('BetaStats.complete-items')}
        </StatCard>
        <StatCard
          icon={CiMicrochip}
          value={!stats || isLoading ? null : format.number(stats.itemToProcess)}
        >
          {t('BetaStats.process-queue')}
        </StatCard>
        <StatCard
          icon={CiBadgeDollar}
          value={!stats || isLoading ? null : format.number(stats.tradeQueue)}
        >
          <Link href="/feedback/trades">
            {t('BetaStats.trade-pricing-queue')} <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </StatCard>
        <StatCard
          icon={CiCircleCheck}
          value={!stats || isLoading ? null : format.number(stats.feedbackVoting)}
        >
          <Link href="/feedback/vote">
            {t('BetaStats.feedback-voting-queue')} <ExternalLinkIcon verticalAlign="center" />
          </Link>
        </StatCard>
      </Flex>
    </Center>
  );
};

export default BetaStatsCard;

type StatCardProps = {
  icon: React.ElementType;
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
