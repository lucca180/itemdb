'use client';

import { Badge, Box, Collapsible, Flex, Heading, HStack, Link, List, Text } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import type { StyleToken } from '@utils/petStyles/display';
import type { LebronTrade } from '@types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { WearablePreview } from '@app/[locale]/rainbow-pool/components/WearablePreview';
import { wearablePreviewSources } from '@utils/cdnPreview';
import { useFormatLongDate } from './formatLongDate';
import { UTCDate } from '@date-fns/utc';
import { isValidTradeDate } from '@app/_components/Item/NCTrade/ncTradeHistoryUtils';

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

  const activePreview = active.imageId ? wearablePreviewSources(active.imageId) : null;

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
          {activePreview && (
            <WearablePreview
              cdnSrc={activePreview.cdn}
              apiSrc={activePreview.api}
              alt={`${active.name} preview`}
              size={PREVIEW_SIZE}
              canCycle={canCycle}
              onPrev={() => goTo(activeIndex - 1)}
              onNext={() => goTo(activeIndex + 1)}
              prevLabel={t('prev-style')}
              nextLabel={t('next-style')}
            />
          )}
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
          <HStack gap={1} flexWrap="wrap">
            {token.ncValue && <LebronValueBadge ncValue={token.ncValue} />}
            {token.inStudio && <AvailableNowBadge />}
          </HStack>
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
          itemName={token.name}
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

function LebronValueBadge({ ncValue }: { ncValue: { range: string; source: string } }) {
  return (
    <Badge
      colorPalette={ncValue.source === 'lebron' ? 'yellow' : 'purple'}
      size="xs"
      alignSelf="flex-start"
      w="fit-content"
      fontSize="2xs"
      px={1.5}
      py={0}
      whiteSpace="normal"
    >
      {ncValue.range} Caps
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
  itemName,
  itemHref,
}: {
  trades: LebronTrade[];
  tradeCount: number;
  itemName: string;
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
            <TradeCard
              key={`${trade.tradeDate}-${trade.itemsSent}-${trade.itemsReceived}`}
              trade={trade}
              itemName={itemName}
            />
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

function splitTradeItems(value: string): string[] {
  return value
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
}

const isSameTradeItemName = (tradeStr: string, itemName: string) =>
  tradeStr.toLowerCase().includes(itemName.toLowerCase());

/** Default highlight colour — same fallback as item-page `NCTradeHistoryCard`. */
const TRADE_HIGHLIGHT_RGB = [71, 178, 248] as const;

function TradeLine({ text, itemName }: { text: string; itemName: string }) {
  const highlighted = isSameTradeItemName(text, itemName);
  return (
    <List.Item
      px={1}
      py={0.5}
      borderRadius="md"
      bg={
        highlighted
          ? `rgba(${TRADE_HIGHLIGHT_RGB[0]},${TRADE_HIGHLIGHT_RGB[1]}, ${TRADE_HIGHLIGHT_RGB[2]},.4)`
          : undefined
      }
    >
      {text}
    </List.Item>
  );
}

function TradeCard({ trade, itemName }: { trade: LebronTrade; itemName: string }) {
  const t = useTranslations();
  const formatLongDate = useFormatLongDate();
  const date = new UTCDate(Number(trade.tradeDate));
  const dateLabel = isValidTradeDate(date)
    ? formatLongDate(date.toISOString())
    : t('General.unknown-date');

  return (
    <Box bg="blackAlpha.500" borderRadius="md" p={2} fontSize="xs" textAlign="start">
      <Text color="whiteAlpha.600" mb={2}>
        {dateLabel}
      </Text>
      <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
        <Box flex="1">
          <Heading size="xs" textTransform="uppercase" mb={1} color="whiteAlpha.700">
            {t('ItemPage.traded')}
          </Heading>
          <List.Root as="ul" gap={0.5} ps={4}>
            {splitTradeItems(trade.itemsSent).map((item) => (
              <TradeLine key={item} text={item} itemName={itemName} />
            ))}
          </List.Root>
        </Box>
        <Box flex="1">
          <Heading size="xs" textTransform="uppercase" mb={1} color="whiteAlpha.700">
            {t('ItemPage.traded-for')}
          </Heading>
          <List.Root as="ul" gap={0.5} ps={4}>
            {splitTradeItems(trade.itemsReceived).map((item) => (
              <TradeLine key={item} text={item} itemName={itemName} />
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

export { AvailableNowBadge, LebronValueBadge };
