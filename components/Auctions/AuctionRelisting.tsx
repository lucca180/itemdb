'use client';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type KeyboardEvent } from 'react';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { LuChevronDown, LuMinus } from 'react-icons/lu';
import { getPercentChange } from '@app/_components/Item/Price/itemPriceUtils';
import type { ListingRelisting } from '@types';

const NST_DATE_FORMAT = {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'america/los_angeles',
} as const;

// Fits the widest expected change (e.g. "▲+1900%") so prices stay aligned in a column.
const PRICE_CHANGE_WIDTH = '56px';

/** Makes a whole auction row toggle its relisting history when it has one. */
export function useAuctionRelistingToggle(relisting: ListingRelisting | undefined) {
  const [open, setOpen] = useState(false);

  if (!relisting) return { open: false, rowProps: {} };

  const toggle = () => {
    if (!open) window.umami?.track('relisting-open', { type: 'auction', count: relisting.count });
    setOpen(!open);
  };

  return {
    open,
    rowProps: {
      tabIndex: 0,
      'aria-expanded': open,
      cursor: 'pointer',
      _hover: { bg: 'whiteAlpha.100' },
      onClick: toggle,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggle();
      },
    },
  };
}

type AuctionPriceChangeProps = {
  price: number;
  previousPrice: number | null | undefined;
  /** Keeps the empty slot when there is no previous listing, so prices stay aligned. */
  reserveSpace?: boolean;
};

const formatPriceChange = (price: number, previousPrice: number) => {
  if (price === previousPrice) return '0';
  // getPercentChange rounds tiny changes to "+0.0", which reads as no change.
  if (Math.abs((price - previousPrice) / previousPrice) * 100 < 0.1) return '<0.1';
  return getPercentChange(price, previousPrice);
};

/** Percent change from the owner's previous listing, in a fixed-width slot. */
export const AuctionPriceChange = ({
  price,
  previousPrice,
  reserveSpace,
}: AuctionPriceChangeProps) => {
  const t = useTranslations();

  if (!previousPrice) {
    return reserveSpace ? <Box as="span" w={PRICE_CHANGE_WIDTH} flexShrink={0} /> : null;
  }

  const isUp = price > previousPrice;
  const isDown = price < previousPrice;

  return (
    <Flex
      as="span"
      display="inline-flex"
      alignItems="center"
      gap={0.5}
      w={PRICE_CHANGE_WIDTH}
      flexShrink={0}
      whiteSpace="nowrap"
      fontSize="2xs"
      fontWeight="semibold"
      color={isUp ? 'green.300' : isDown ? 'red.300' : 'whiteAlpha.500'}
      title={t('ItemPage.auction-price-change')}
    >
      <Icon as={isUp ? FaCaretUp : isDown ? FaCaretDown : LuMinus} boxSize={3} flexShrink={0} />
      {formatPriceChange(price, previousPrice)}%
    </Flex>
  );
};

export const AuctionRelistedTag = ({ count, open }: { count: number; open: boolean }) => {
  const t = useTranslations();

  return (
    <Badge colorPalette="orange" size="xs" variant="subtle" gap={1}>
      {t('ItemPage.auction-relisted', { count })}
      <Icon
        as={LuChevronDown}
        boxSize={3}
        transition="transform 0.2s"
        transform={open ? 'rotate(180deg)' : undefined}
      />
    </Badge>
  );
};

/** Previous listings of a relisting chain, newest first. All of them ended with no bids. */
export const AuctionRelistingHistory = ({ relisting }: { relisting: ListingRelisting }) => {
  const t = useTranslations();
  const format = useFormatter();
  const { history } = relisting;

  return (
    <Flex flexFlow="column" gap={2} whiteSpace="normal">
      <Text fontSize="xs" color="whiteAlpha.700">
        {t('ItemPage.auction-relisting-history', {
          date: format.dateTime(new Date(relisting.since), NST_DATE_FORMAT),
        })}
      </Text>
      {/* Rows use subgrid so the price / change / bids / date columns line up across rows. */}
      <Box
        display="grid"
        gridTemplateColumns={`max-content ${PRICE_CHANGE_WIDTH} max-content 1fr`}
        borderRadius="md"
        overflow="hidden"
      >
        {history.map((entry, i) => (
          <Box
            key={`${i}-${entry.date}`}
            display="grid"
            gridTemplateColumns="subgrid"
            gridColumn="1 / -1"
            columnGap={3}
            alignItems="center"
            px={2}
            py={1.5}
            fontSize="xs"
            bg={i % 2 === 0 ? 'blackAlpha.300' : 'blackAlpha.500'}
          >
            <Text fontWeight="semibold" textAlign="right">
              {entry.price !== null && `${format.number(entry.price)} NP`}
            </Text>
            {entry.price !== null ? (
              <AuctionPriceChange
                price={entry.price}
                previousPrice={history[i + 1]?.price}
                reserveSpace
              />
            ) : (
              <Box />
            )}
            <Badge colorPalette="gray" size="xs" justifySelf="start">
              {t('ItemPage.no-bids')}
            </Badge>
            <Text color="whiteAlpha.700" textAlign="right">
              {format.dateTime(new Date(entry.date), NST_DATE_FORMAT)} NST
            </Text>
          </Box>
        ))}
      </Box>
      <Text fontSize="2xs" color="whiteAlpha.600" textAlign="center">
        {t('ItemPage.relisting-disclaimer')}
      </Text>
    </Flex>
  );
};
