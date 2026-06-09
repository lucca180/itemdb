'use client';

import { Badge, Box, Button, Flex, Separator, SimpleGrid, Text } from '@chakra-ui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ItemAuctionData, ItemData } from '@types';
import { getAuctionCardCount, getAuctionCardEntries } from '@components/Auctions/auctionCardUtils';
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

const AuctionCard = ({ auctions, item, totalSold, soldMedianPrice }: Props) => {
  const t = useTranslations();
  const now = useNow({
    updateInterval: 1000 * 10,
  });
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
        <Flex bg="gray.600" overflowY="auto" minH={0} flex="1" flexFlow="column">
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
            <Box key={auction.internal_id}>
              <Separator />
              <Flex p={3} gap={2} justifyContent="space-between" alignItems="flex-start">
                <Flex flexFlow="column" gap={1}>
                  <Text fontWeight="semibold" color="whiteAlpha.900" fontSize="sm">
                    {format.number(auction.price)} NP
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.600">
                    {auction.isNF && '[NF] '}
                    {auction.timeLeft ?? t('General.unknown')}
                  </Text>
                </Flex>
                <Flex flexFlow="column" gap={1} alignItems="flex-end" textAlign="right">
                  <Badge colorPalette={auction.hasBuyer ? 'green' : 'gray'} size="xs">
                    {auction.hasBuyer ? t('ItemPage.has-bids') : t('ItemPage.no-bids')}
                  </Badge>
                  <Text fontSize="xs" color="whiteAlpha.600" suppressHydrationWarning>
                    {format.relativeTime(new Date(auction.addedAt), now)}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          ))}
          <Flex p={2} flexFlow="column" gap={2}>
            <Button size="xs" variant="subtle" onClick={() => setHistoryOpen(true)}>
              {t('ItemPage.show-more')}
            </Button>
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
