import Link from 'next/link';
import React from 'react';
import { cookies } from 'next/headers';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Flex, styled } from '@styled/jsx';
import {
  CiBadgeDollar,
  CiCircleCheck,
  CiMicrochip,
  CiShoppingBasket,
  CiShoppingTag,
} from 'react-icons/ci';
import { LuExternalLink } from 'react-icons/lu';
import { getBetaStats } from '@pages/api/v1/beta';

type StatsCardLoadingProps = {
  itemsInDbLabel: string;
  completeItemsLabel: string;
  processQueueLabel: string;
  tradePricingQueueLabel: string;
  feedbackVotingQueueLabel: string;
};

const StatsCard = async () => {
  const t = await getTranslations();
  const format = await getFormatter();
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const stats = await getBetaStats(session).catch(() => null);

  const completionPercentage =
    stats && stats.itemsTotal > 0
      ? (((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(0)
      : null;

  return (
    <Flex h="100%" w="100%" alignItems="center" justifyContent="center">
      <Flex flexFlow="column" gap={5} w="100%" maxW="400px">
        <StatCard icon={CiShoppingBasket} value={!stats ? null : format.number(stats.itemsTotal)}>
          {t('BetaStats.items-in-db')}
        </StatCard>
        <StatCard
          icon={CiShoppingTag}
          value={!completionPercentage ? null : <>{completionPercentage}%</>}
        >
          {t('BetaStats.complete-items')}
        </StatCard>
        <StatCard icon={CiMicrochip} value={!stats ? null : format.number(stats.itemToProcess)}>
          {t('BetaStats.process-queue')}
        </StatCard>
        <StatCard icon={CiBadgeDollar} value={!stats ? null : format.number(stats.tradeQueue)}>
          <Link href="/feedback/trades">
            <styled.span display="inline-flex" alignItems="center" gap={1}>
              {t('BetaStats.trade-pricing-queue')}
              <LuExternalLink />
            </styled.span>
          </Link>
        </StatCard>
        <StatCard icon={CiCircleCheck} value={!stats ? null : format.number(stats.feedbackVoting)}>
          <Link href="/feedback/vote">
            <styled.span display="inline-flex" alignItems="center" gap={1}>
              {t('BetaStats.feedback-voting-queue')}
              <LuExternalLink />
            </styled.span>
          </Link>
        </StatCard>
      </Flex>
    </Flex>
  );
};

export default StatsCard;

export function StatsCardLoading(props: StatsCardLoadingProps) {
  return (
    <Flex h="100%" w="100%" alignItems="center" justifyContent="center">
      <Flex flexFlow="column" gap={5} w="100%" maxW="400px">
        <StatCard icon={CiShoppingBasket} value={null}>
          {props.itemsInDbLabel}
        </StatCard>
        <StatCard icon={CiShoppingTag} value={null}>
          {props.completeItemsLabel}
        </StatCard>
        <StatCard icon={CiMicrochip} value={null}>
          {props.processQueueLabel}
        </StatCard>
        <StatCard icon={CiBadgeDollar} value={null}>
          {props.tradePricingQueueLabel}
        </StatCard>
        <StatCard icon={CiCircleCheck} value={null}>
          {props.feedbackVotingQueueLabel}
        </StatCard>
      </Flex>
    </Flex>
  );
}

type StatCardProps = {
  icon: React.ElementType;
  value: React.ReactNode | null;
  children: React.ReactNode;
};

const StatCard = (props: StatCardProps) => {
  const hasValue = props.value !== null;
  const IconComponent = props.icon;

  return (
    <Flex alignItems="center" gap={5} bg="whiteAlpha.100" p={2} borderRadius="sm" w="100%">
      <styled.div fontSize="52px" lineHeight="1" display="flex" alignItems="center">
        <IconComponent />
      </styled.div>
      <Flex flexFlow="column" gap={1} w="100%">
        {hasValue && (
          <styled.h3 fontSize="1.7rem" fontWeight="bold" lineHeight="1.2">
            {props.value}
          </styled.h3>
        )}
        {!hasValue && (
          <styled.div
            h="1.3rem"
            w="70%"
            mb={1}
            borderRadius="sm"
            bg="whiteAlpha.300"
            animation="pulse"
          />
        )}
        <styled.h4 color="gray.300" fontWeight="400" fontSize="sm" lineHeight="1.2">
          {props.children}
        </styled.h4>
      </Flex>
    </Flex>
  );
};
