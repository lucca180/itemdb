/**
 * NP Price — server orchestrator (item page).
 *
 * NP prices loaded via `loadNPPrices` in this section.
 * Card shell + price history render from fetched prices.
 * Price status, official list markers, admin controls, seeking/trading, and last seen stream via Suspense.
 * Client shell: ItemPriceCard.tsx
 */
import { Suspense, type ReactNode } from 'react';
import { Box, Center, Flex, Text } from '@chakra-ui/react';
import { MdMoneyOff } from 'react-icons/md';
import { getFormatter, getTranslations } from 'next-intl/server';
import CardBase from '@components/Card/CardBase';
import MatchTable from '@app/_components/Item/NCTrade/MatchTable';
import {
  loadLastSeen,
  loadItemPriceMarkers,
  loadNPPrices,
  loadPriceStatus,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import type { ItemData, PriceData, PriceMarker } from '@types';
import {
  buildLastSeenCards,
  buildLastSeenStaticCards,
  filterNPSeekingLists,
  filterNPTradingLists,
  getHelpNeededData,
  getLatestPrice,
  getPriceDiff,
} from '@app/_components/Item/Price/itemPriceUtils';
import { PriceTableView } from '@app/_components/Item/Price/PriceTable';
import { getCachedPriceTableData } from '@app/_components/Item/Price/loadPriceTableData';
import {
  HelpNeeded,
  ItemPriceModalProvider,
  ItemPricePanel,
  ItemPricePanelSkeleton,
  ItemPriceTabBar,
  ItemPriceTabProvider,
  LastSeenCards,
  LastSeenHelpHeading,
  PriceChartPanel,
  PriceEmptyPanel,
  PriceStatActions,
} from '@app/_components/Item/Price/ItemPriceCard';

type ItemProps = { item: ItemData };

type ItemPriceShellProps = ItemProps & {
  prices: PriceData[];
};

type ItemPriceLoadedProps = ItemProps;

type ItemPriceLabels = {
  t: Awaited<ReturnType<typeof getTranslations>>;
  format: Awaited<ReturnType<typeof getFormatter>>;
};

function priceTableMarkerLabels(t: ItemPriceLabels['t']) {
  return {
    unavailableAt: t('ItemPage.unavailable-at'),
    availableAt: t('ItemPage.available-at'),
    addedTo: t('ItemPage.added-to'),
  };
}

// --- Price table (shared via PriceTable.tsx) ---

function PriceTablePanel({
  item,
  prices,
  t,
  format,
}: ItemProps & ItemPriceShellProps & ItemPriceLabels) {
  if (!prices.length) {
    return (
      <PriceEmptyPanel
        labels={{
          noData: t('ItemPage.no-data'),
          learnHelp: t('General.learnHelp'),
        }}
      />
    );
  }

  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <Suspense
        fallback={
          <PriceTableViewCached itemColor={item.color.hex} data={prices} t={t} format={format} />
        }
      >
        <PriceTableTabFull item={item} prices={prices} t={t} format={format} />
      </Suspense>
    </Box>
  );
}

async function PriceTableViewCached({
  data,
  markers = [],
  isAdmin,
  itemColor,
  t,
  format,
}: {
  data: PriceData[];
  markers?: PriceMarker[];
  isAdmin?: boolean;
  itemColor: string;
  t: ItemPriceLabels['t'];
  format: ItemPriceLabels['format'];
}) {
  const sortedData = await getCachedPriceTableData(data, markers, priceTableMarkerLabels(t));

  return (
    <PriceTableView
      itemColor={itemColor}
      data={data}
      markers={markers}
      sortedData={sortedData}
      isAdmin={isAdmin}
      t={t}
      format={format}
    />
  );
}

async function PriceTableTabFull({
  item,
  prices,
  t,
  format,
}: ItemProps & ItemPriceShellProps & ItemPriceLabels) {
  const [{ user }, markers] = await Promise.all([
    getServerCurrentUser(),
    loadItemPriceMarkers(
      item.internal_id,
      item.firstSeen,
      shouldShowTradeLists(item, await getCachedNow())
    ),
  ]);

  return (
    <PriceTableViewCached
      itemColor={item.color.hex}
      data={prices}
      markers={markers}
      isAdmin={!!user?.isAdmin}
      t={t}
      format={format}
    />
  );
}

async function PriceChartTabFull({ item, prices }: ItemProps & ItemPriceShellProps) {
  const markers = await loadItemPriceMarkers(
    item.internal_id,
    item.firstSeen,
    shouldShowTradeLists(item, await getCachedNow())
  );

  return <PriceChartPanel item={item} prices={prices} markers={markers} />;
}

async function PriceHelpBannerAsync({
  item,
  prices,
}: ItemProps & Pick<ItemPriceShellProps, 'prices'>) {
  const [{ user }, t] = await Promise.all([getServerCurrentUser(), getTranslations()]);
  const priceStatus = await loadPriceStatus(item.internal_id, user?.id);
  const helpData = getHelpNeededData(priceStatus, getLatestPrice(prices));
  if (!helpData) return null;

  return (
    <HelpNeeded
      item={item}
      labels={{
        title: t('Feedback.we-need-your-help'),
        description: t('Feedback.price-update-txt'),
        priceTradeLots: helpData.needPricing
          ? t('Feedback.price-x-trade-lots', { x: helpData.needPricing })
          : null,
        voteSuggestions: helpData.needVoting
          ? t('Feedback.vote-x-suggestions', { x: helpData.needVoting })
          : null,
      }}
    />
  );
}

async function NPSeekingTab({ item }: ItemProps) {
  const tradeLists = await loadTradeLists(item.internal_id);
  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <MatchTable data={filterNPSeekingLists(tradeLists)} matches={null} type="seeking" />
    </Box>
  );
}

async function NPTradingTab({ item }: ItemProps) {
  const tradeLists = await loadTradeLists(item.internal_id);
  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <MatchTable data={filterNPTradingLists(tradeLists)} matches={null} type="trading" />
    </Box>
  );
}

async function LastSeenStats({ item }: ItemProps) {
  const [lastSeen, t, format, now] = await Promise.all([
    loadLastSeen(item.internal_id),
    getTranslations(),
    getFormatter(),
    getCachedNow(),
  ]);
  return <LastSeenCards cards={buildLastSeenCards(item, lastSeen, t, format, now)} />;
}

// --- Orchestrator ---

function ItemPriceModalShell({ item, children }: ItemProps & { children: ReactNode }) {
  return <ItemPriceModalProvider item={item}>{children}</ItemPriceModalProvider>;
}

async function ItemPriceTradeableCard({ item, prices }: ItemPriceShellProps) {
  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getCachedNow()]);
  const shouldShowLists = shouldShowTradeLists(item, now);
  const price = getLatestPrice(prices);
  const priceDiff = getPriceDiff(prices);

  return (
    <ItemPriceModalShell item={item}>
      <CardBase color={item.color.rgb} title={t('ItemPage.price-overview')}>
        <Flex gap={3} flexFlow="column">
          <Suspense fallback={null}>
            <PriceHelpBannerAsync item={item} prices={prices} />
          </Suspense>

          <ItemPriceTabProvider defaultTab="table">
            <ItemPriceTabBar
              shouldShowLists={shouldShowLists}
              labels={{
                table: t('ItemPage.price-history'),
                trading: t('ItemPage.selling'),
                seeking: t('ItemPage.buying'),
                chart: t('ItemPage.price-chart'),
              }}
            />

            <Flex
              flexFlow={{ base: 'column', md: 'row' }}
              alignItems={{ base: 'inherit', md: 'center' }}
              justifyContent={{ base: 'flex-start', md: 'space-around' }}
              gap={2}
            >
              <PriceStatActions
                item={item}
                inflated={price?.inflated}
                valueText={price?.value ? `${format.number(price.value)} NP` : '??? NP'}
                dateLabel={
                  price?.addedAt
                    ? format.dateTime(new Date(price.addedAt), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : undefined
                }
                showNoInfo={!price?.addedAt}
                hasKnownPrice={!!price?.value}
                priceDiff={priceDiff}
                priceDiffLabel={priceDiff !== null ? `${format.number(priceDiff)} NP` : null}
                labels={{
                  inflation: t('General.inflation'),
                  noInfo: t('ItemPage.no-info'),
                  wrongPrice: t('ItemPage.wrong-price'),
                }}
              />

              <Flex flexFlow="column" width="100%" maxW="580px">
                <ItemPricePanel tab="table">
                  <PriceTablePanel item={item} prices={prices} t={t} format={format} />
                </ItemPricePanel>
                <ItemPricePanel tab="chart">
                  <Suspense fallback={<PriceChartPanel item={item} prices={prices} />}>
                    <PriceChartTabFull item={item} prices={prices} />
                  </Suspense>
                </ItemPricePanel>
                {shouldShowLists && (
                  <ItemPricePanel tab="trading">
                    <Suspense fallback={<ItemPricePanelSkeleton />}>
                      <NPTradingTab item={item} />
                    </Suspense>
                  </ItemPricePanel>
                )}
                {shouldShowLists && (
                  <ItemPricePanel tab="seeking">
                    <Suspense fallback={<ItemPricePanelSkeleton />}>
                      <NPSeekingTab item={item} />
                    </Suspense>
                  </ItemPricePanel>
                )}
              </Flex>
            </Flex>
          </ItemPriceTabProvider>

          <LastSeenHelpHeading label={t('ItemPage.seen-at')} />
          <Suspense fallback={<LastSeenCards cards={buildLastSeenStaticCards(t)} />}>
            <LastSeenStats item={item} />
          </Suspense>
        </Flex>
      </CardBase>
    </ItemPriceModalShell>
  );
}

export async function ItemPriceSection({ item }: ItemPriceLoadedProps) {
  if (item.isNC) return null;
  if (item.status?.toLowerCase() === 'no trade') {
    const t = await getTranslations();
    return (
      <CardBase color={item.color.rgb} title={t('ItemPage.price-overview')}>
        <Center>
          <MdMoneyOff size={100} opacity={0.4} />
        </Center>
        <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
      </CardBase>
    );
  }

  const prices = await loadNPPrices(item.internal_id);
  return <ItemPriceTradeableCard item={item} prices={prices} />;
}

export default ItemPriceSection;
