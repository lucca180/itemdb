import type { ElementType, ReactNode } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Heading, Link, Skeleton, Text } from '@chakra-ui/react';
import {
  CiBadgeDollar,
  CiCircleCheck,
  CiMicrochip,
  CiShoppingBasket,
  CiShoppingTag,
} from 'react-icons/ci';
import { LuExternalLink } from 'react-icons/lu';

export type StatsCardLoadingProps = {
  itemsInDbLabel: string;
  completeItemsLabel: string;
  processQueueLabel: string;
  tradePricingQueueLabel: string;
  feedbackVotingQueueLabel: string;
};

export type StatsCardData = {
  itemsTotal: ReactNode | null;
  completionPercentage: ReactNode | null;
  itemToProcess: ReactNode | null;
  tradeQueue: ReactNode | null;
  feedbackVoting: ReactNode | null;
};

type StatCardProps = {
  icon: ElementType;
  value: ReactNode | null;
  children: ReactNode;
};

type LinkedStatLabelProps = {
  href: string;
  children: ReactNode;
};

type StatsCardContentProps = {
  data: StatsCardData;
  labels: StatsCardLoadingProps;
};

export function StatsCardContent({ data, labels }: StatsCardContentProps) {
  return (
    <StatsCardShell>
      <StatCard icon={CiShoppingBasket} value={data.itemsTotal}>
        {labels.itemsInDbLabel}
      </StatCard>
      <StatCard icon={CiShoppingTag} value={data.completionPercentage}>
        {labels.completeItemsLabel}
      </StatCard>
      <StatCard icon={CiMicrochip} value={data.itemToProcess}>
        {labels.processQueueLabel}
      </StatCard>
      <StatCard icon={CiBadgeDollar} value={data.tradeQueue}>
        <LinkedStatLabel href="/feedback/trades">{labels.tradePricingQueueLabel}</LinkedStatLabel>
      </StatCard>
      <StatCard icon={CiCircleCheck} value={data.feedbackVoting}>
        <LinkedStatLabel href="/feedback/vote">{labels.feedbackVotingQueueLabel}</LinkedStatLabel>
      </StatCard>
    </StatsCardShell>
  );
}

export function StatsCardLoading(props: StatsCardLoadingProps) {
  return (
    <StatsCardShell>
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
    </StatsCardShell>
  );
}

function StatsCardShell({ children }: { children: ReactNode }) {
  return (
    <Flex h="100%" w="100%" alignItems="center" justifyContent="center">
      <Flex direction="column" gap={5} w="100%" maxW="400px">
        {children}
      </Flex>
    </Flex>
  );
}

function StatCard(props: StatCardProps) {
  const hasValue = props.value !== null;
  const IconComponent = props.icon;

  return (
    <Flex alignItems="center" gap={5} bg="whiteAlpha.100" p={2} borderRadius="sm" w="100%">
      <Box fontSize="52px" lineHeight="1" display="flex" alignItems="center">
        <IconComponent />
      </Box>
      <Flex direction="column" gap={1} w="100%">
        {hasValue ? (
          <Heading as="h3" fontSize="2xl">
            {props.value}
          </Heading>
        ) : (
          <Skeleton h="1.3rem" w="70%" mb={1} borderRadius="sm" />
        )}
        <Text as="h4" color="gray.300" fontWeight="400" fontSize="sm">
          {props.children}
        </Text>
      </Flex>
    </Flex>
  );
}

function LinkedStatLabel({ href, children }: LinkedStatLabelProps) {
  return (
    <Link asChild color="gray.300" _hover={{ color: 'whiteAlpha.900' }}>
      <NextLink href={href}>
        <Box as="span" display="inline-flex" alignItems="center" gap={1}>
          {children}
          <LuExternalLink />
        </Box>
      </NextLink>
    </Link>
  );
}
