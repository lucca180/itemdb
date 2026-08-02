'use client';

import {
  Badge,
  Box,
  Collapsible,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  List,
  Text,
} from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import type { StyleNcTrade, StyleToken } from '@utils/petStyles/display';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useFormatLongDate } from './formatLongDate';

const PREVIEW_SIZE = 280;

type StyleTokenSeriesBlockProps = {
  series: string;
  items: StyleToken[];
};

/** Series row for the styles combo page — preview + token list + trade counts. */
export function StyleTokenSeriesBlock({ series, items }: StyleTokenSeriesBlockProps) {
  const t = useTranslations('PetStyles');
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];
  const canCycle = items.length > 1;

  if (!active) return null;

  const goTo = (index: number) => {
    const len = items.length;
    if (!len) return;
    setActiveIndex(((index % len) + len) % len);
  };

  return (
    <Box w="100%">
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="whiteAlpha.900"
        mb={2}
        textAlign={{ base: 'center', md: 'start' }}
      >
        {series}
      </Text>
      <Flex
        gap={4}
        align={{ base: 'center', md: 'flex-start' }}
        direction={{ base: 'column', sm: 'row' }}
        w="100%"
      >
        <Flex flexFlow="column" align="center" gap={2} w="100%" maxW={`${PREVIEW_SIZE}px`}>
          <Box
            w="100%"
            maxW={`${PREVIEW_SIZE}px`}
            aspectRatio={1}
            borderRadius="md"
            bg="blackAlpha.500"
            overflow="hidden"
            position="relative"
          >
            <Image
              src={active.previewUrl}
              alt={`${active.name} preview`}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              unoptimized
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
            {canCycle && (
              <>
                <IconButton
                  aria-label={t('prev-style')}
                  size="xs"
                  variant="subtle"
                  bg="blackAlpha.700"
                  position="absolute"
                  left={1}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => goTo(activeIndex - 1)}
                >
                  <LuChevronLeft />
                </IconButton>
                <IconButton
                  aria-label={t('next-style')}
                  size="xs"
                  variant="subtle"
                  bg="blackAlpha.700"
                  position="absolute"
                  right={1}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => goTo(activeIndex + 1)}
                >
                  <LuChevronRight />
                </IconButton>
              </>
            )}
          </Box>
          {canCycle && (
            <Text fontSize="xs" color="whiteAlpha.700">
              {activeIndex + 1}/{items.length}
            </Text>
          )}
        </Flex>

        <Flex flexFlow="column" gap={2} flex="1" w="100%" minW={0}>
          {items.map((item, index) => (
            <StyleTokenListRow
              key={item.id}
              token={item}
              selected={index === activeIndex}
              onSelect={() => setActiveIndex(index)}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}

function StyleTokenListRow({
  token,
  selected,
  onSelect,
}: {
  token: StyleToken;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations();
  return (
    <Box
      p={2}
      borderRadius="md"
      bg={selected ? 'blackAlpha.600' : 'blackAlpha.400'}
      outline={selected ? '2px solid rgba(103, 232, 249, 0.45)' : undefined}
    >
      <Flex gap={3} align="center" cursor="pointer" onClick={onSelect} flexWrap="wrap">
        <Box
          w="48px"
          h="48px"
          borderRadius="md"
          bg="blackAlpha.500"
          overflow="hidden"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            src={token.imageUrl}
            alt=""
            width={48}
            height={48}
            unoptimized
            style={{ objectFit: 'contain' }}
          />
        </Box>

        <Flex flexFlow="column" gap={1} flex="1" minW="140px">
          <Link
            asChild
            color="cyan.100"
            fontWeight="semibold"
            fontSize="sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MainLink href={`/item/${token.itemSlug}`}>{token.name}</MainLink>
          </Link>
          {token.inStudio && <AvailableNowBadge />}
        </Flex>

        <HStack
          gap={3}
          fontSize="xs"
          color="whiteAlpha.800"
          flexShrink={0}
          onClick={(e) => e.stopPropagation()}
        >
          <StatLink
            href={`/item/${token.itemSlug}`}
            label={t('ItemPage.seeking')}
            count={token.seekingCount}
          />
          <StatLink
            href={`/item/${token.itemSlug}`}
            label={t('ItemPage.trading')}
            count={token.tradingCount}
          />
        </HStack>
      </Flex>

      <Box mt={2} onClick={(e) => e.stopPropagation()}>
        <TradeHistoryCollapse
          trades={token.trades}
          tradeCount={token.ncTradeCount}
          itemHref={`/item/${token.itemSlug}`}
        />
      </Box>
    </Box>
  );
}

function AvailableNowBadge() {
  const t = useTranslations('PetStyles');
  return (
    <Badge
      colorPalette="yellow"
      size="xs"
      color="yellow.200"
      bg="yellow.500/25"
      alignSelf="flex-start"
      w="fit-content"
      fontSize="2xs"
      px={1.5}
      py={0}
    >
      {t('available-now')}
    </Badge>
  );
}

function StatLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link asChild color="teal.200" _hover={{ color: 'teal.100' }}>
      <MainLink href={href}>
        <Text as="span" color="whiteAlpha.600">
          {label}{' '}
        </Text>
        <Text as="span" fontWeight="bold">
          {count}
        </Text>
      </MainLink>
    </Link>
  );
}

function TradeHistoryCollapse({
  trades,
  tradeCount,
  itemHref,
}: {
  trades: StyleNcTrade[];
  tradeCount: number;
  itemHref: string;
}) {
  const t = useTranslations('PetStyles');
  if (tradeCount <= 0) {
    return (
      <Text fontSize="xs" color="whiteAlpha.500" ps={1}>
        {t('no-trade-reports')}
      </Text>
    );
  }

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        display="flex"
        alignItems="center"
        gap={1}
        fontSize="xs"
        color="teal.200"
        cursor="pointer"
        _hover={{ color: 'teal.100' }}
        py={1}
      >
        <Collapsible.Indicator transition="transform 0.15s" _open={{ transform: 'rotate(180deg)' }}>
          <LuChevronDown />
        </Collapsible.Indicator>
        <Text as="span" color="whiteAlpha.600">
          {t('trades')}{' '}
        </Text>
        <Text as="span" fontWeight="bold">
          {tradeCount}
        </Text>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex flexFlow="column" gap={2} pt={2} ps={1}>
          {trades.map((trade) => (
            <TradeCard key={`${trade.date}-${trade.offered.join()}`} trade={trade} />
          ))}
          {tradeCount > trades.length && (
            <Link asChild fontSize="xs" color="teal.200">
              <MainLink href={itemHref}>{t('view-all-trades', { count: tradeCount })}</MainLink>
            </Link>
          )}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function TradeCard({ trade }: { trade: StyleNcTrade }) {
  const t = useTranslations();
  const formatLongDate = useFormatLongDate();

  return (
    <Box bg="blackAlpha.500" borderRadius="md" p={2} fontSize="xs" textAlign="start">
      <Text color="whiteAlpha.600" mb={2}>
        {formatLongDate(trade.date)}
      </Text>
      <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
        <Box flex="1">
          <Heading size="xs" textTransform="uppercase" mb={1} color="whiteAlpha.700">
            {t('ItemPage.traded')}
          </Heading>
          <List.Root as="ul" gap={0.5} ps={4}>
            {trade.offered.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>
        </Box>
        <Box flex="1">
          <Heading size="xs" textTransform="uppercase" mb={1} color="whiteAlpha.700">
            {t('ItemPage.traded-for')}
          </Heading>
          <List.Root as="ul" gap={0.5} ps={4}>
            {trade.received.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>
        </Box>
      </Flex>
      {trade.notes && (
        <Box mt={2}>
          <Heading size="xs" textTransform="uppercase" mb={1} color="whiteAlpha.700">
            {t('ItemPage.notes')}
          </Heading>
          <Text color="whiteAlpha.800" css={{ textWrap: 'pretty' }}>
            {trade.notes}
          </Text>
        </Box>
      )}
    </Box>
  );
}

type StyleTokensSectionProps = {
  groups: { series: string; items: StyleToken[] }[];
  heading: string;
  hint?: string;
};

export function StyleTokensSection({ groups, heading, hint }: StyleTokensSectionProps) {
  if (!groups.length) return null;

  return (
    <Flex
      flexFlow="column"
      gap={3}
      p={3}
      bg="blackAlpha.400"
      borderRadius="lg"
      w="100%"
      align={{ base: 'center', md: 'flex-start' }}
      textAlign={{ base: 'center', md: 'start' }}
    >
      <Heading as="h2" size="sm" color="cyan.200">
        {heading}
      </Heading>
      {hint && (
        <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
          {hint}
        </Text>
      )}
      <Flex flexFlow="column" gap={5} w="100%">
        {groups.map((group) => (
          <StyleTokenSeriesBlock key={group.series} series={group.series} items={group.items} />
        ))}
      </Flex>
    </Flex>
  );
}

export { AvailableNowBadge };
