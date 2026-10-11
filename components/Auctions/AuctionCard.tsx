'use client';

import { Badge, Button, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ItemAuctionData, ItemData } from '@types';
import {
  AUCTION_CARD_LIMIT,
  getAuctionCardCount,
  getAuctionCardEntries,
} from '@components/Auctions/auctionCardUtils';
import CardBase from '@components/Card/CardBase';
import type { SeenHistoryModalProps } from '@components/SeenHistory/SeenHistoryModal';

type Props = {
  auctions: ItemAuctionData[];
  item: ItemData;
  totalSold: number;
  soldMedianPrice: number | null;
};

const SeenHistoryModal = dynamic<SeenHistoryModalProps>(
  () => import('@components/SeenHistory/SeenHistoryModal'),
  {
    ssr: false,
  }
);

/**
 * Entry styling lives in static selectors so each auction row renders plain elements instead of
 * ~8 Chakra components (Box/Separator/Flex/Text) that each resolve style props on every render.
 */
const AUCTION_LIST_CSS = {
  '& [data-auction-entry]': {
    display: 'flex',
    p: 3,
    gap: 2,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderTop: '1px solid',
    borderColor: 'border',
  },
  '& [data-auction-col]': { display: 'flex', flexDirection: 'column', gap: 1 },
  '& [data-auction-col="end"]': { alignItems: 'flex-end', textAlign: 'right' },
  '& [data-auction-price]': { fontWeight: 'semibold', color: 'whiteAlpha.900', fontSize: 'sm' },
  '& [data-auction-meta]': { fontSize: 'xs', color: 'whiteAlpha.600' },
};

const AuctionCard = ({ auctions, item, totalSold, soldMedianPrice }: Props) => {
  const t = useTranslations();
  // No updateInterval: relative times stay as rendered (no client timer).
  const now = useNow();
  const format = useFormatter();
  const [historyOpen, setHistoryOpen] = useState(false);
  const entries = getAuctionCardEntries(auctions);

  return (
    <>
      <CardBase
        noPadding
        color={item.color.rgb}
        title={
          <>
            {t('ItemPage.auction-history')} <Badge>{getAuctionCardCount(auctions)}</Badge>
          </>
        }
        chakraWrapper={{ maxH: '500px', boxShadow: 'sm' }}
        chakra={{ display: 'flex', flexFlow: 'column', minH: 0, overflow: 'hidden' }}
      >
        <Flex
          bg="gray.600"
          overflowY="auto"
          minH={0}
          flex="1"
          flexFlow="column"
          css={AUCTION_LIST_CSS}
        >
          <SimpleGrid columns={2} gap={2} p={2}>
            <AuctionStat label={t('ItemPage.total-sold')} value={format.number(totalSold)} />
            <AuctionStat
              label={t('ItemPage.sold-median-price')}
              value={soldMedianPrice === null ? '???' : `${format.number(soldMedianPrice)} NP`}
            />
          </SimpleGrid>
          {entries.length === 0 && (
            <Text p={3} textAlign="center" fontSize="sm">
              {t('ItemPage.no-auction-history-card')} :(
            </Text>
          )}
          {entries.map((auction) => (
            <div key={auction.internal_id} data-auction-entry>
              <div data-auction-col>
                <span data-auction-price>{format.number(auction.price)} NP</span>
                <span data-auction-meta>
                  {auction.flag && `[${auction.flag}] `}
                  {auction.timeLeft ?? t('General.unknown')}
                </span>
              </div>
              <div data-auction-col="end">
                <Badge colorPalette={auction.hasBuyer ? 'green' : 'gray'} size="xs">
                  {auction.bidCount != null
                    ? t('ItemPage.bids-count', { x: auction.bidCount })
                    : auction.hasBuyer
                      ? t('ItemPage.has-bids')
                      : t('ItemPage.no-bids')}
                </Badge>
                <span data-auction-meta suppressHydrationWarning>
                  {format.relativeTime(new Date(auction.addedAt), now)}
                </span>
              </div>
            </div>
          ))}
          <Flex p={2} flexFlow="column" gap={2}>
            {entries.length === AUCTION_CARD_LIMIT && (
              <Button size="xs" variant="subtle" onClick={() => setHistoryOpen(true)}>
                {t('ItemPage.show-more')}
              </Button>
            )}
            <Text textAlign="center" fontSize="2xs" color="whiteAlpha.600">
              {t('ItemPage.auction-disclaimer')}
            </Text>
          </Flex>
        </Flex>
      </CardBase>
      {historyOpen && (
        <SeenHistoryModal isOpen onClose={() => setHistoryOpen(false)} item={item} type="auction" />
      )}
    </>
  );
};

function AuctionStat({ label, value }: { label: string; value: string }) {
  return (
    <Flex
      minW={0}
      p={2}
      bg="blackAlpha.400"
      borderRadius="md"
      flexFlow="column"
      textAlign="center"
      justifyContent="center"
    >
      <Text fontSize="2xs" color="whiteAlpha.700">
        {label}
      </Text>
      <Text mt={1} fontSize="xs" fontWeight="semibold" truncate>
        {value}
      </Text>
    </Flex>
  );
}

export default AuctionCard;
