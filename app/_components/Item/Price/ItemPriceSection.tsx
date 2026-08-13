/**
 * NP Price — server orchestrator (item page).
 *
 * Initial table uses a short price summary. Chart, full history, and trade lists
 * load via Server Actions after hover/click.
 * Client shell: ItemPriceCard.tsx
 */
import { Suspense, type ReactNode } from 'react';
import { Center, Flex, Text } from '@chakra-ui/react';
import { MdMoneyOff } from 'react-icons/md';
import { getFormatter, getTranslations } from 'next-intl/server';
import CardBase from '@components/Card/CardBase';
import {
  loadLastSeen,
  loadItemPriceMarkers,
  loadNPPricesSummary,
  loadPriceStatus,
} from '@app/_components/Item/loadUtils';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import type { ItemData, PriceData } from '@types';
import {
  buildLastSeenCards,
  buildLastSeenStaticCards,
  getHelpNeededData,
  getLatestPrice,
  getPriceDiff,
} from '@app/_components/Item/Price/itemPriceUtils';
import {
  HelpNeeded,
  ItemPriceModalProvider,
  ItemPricePanel,
  ItemPriceTabBar,
  ItemPriceTabProvider,
  LastSeenCards,
  LastSeenHelpHeading,
  PriceChartPanel,
  PriceEmptyPanel,
  PriceStatActions,
} from '@app/_components/Item/Price/ItemPriceCard';
import {
  ItemPriceListsPanel,
  PriceHistoryTable,
} from '@app/_components/Item/Price/ItemPriceLazyPanels';

type ItemProps = { item: ItemData };

type ItemPriceShellProps = ItemProps & {
  prices: PriceData[];
  hasMore: boolean;
};

type ItemPriceLoadedProps = ItemProps;

function PriceTablePanel({
  item,
  prices,
  hasMore,
  t,
}: ItemPriceShellProps & { t: Awaited<ReturnType<typeof getTranslations>> }) {
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
    <Suspense
      fallback={<PriceHistoryTable item={item} prices={prices} markers={[]} hasMore={hasMore} />}
    >
      <PriceTableWithMarkers item={item} prices={prices} hasMore={hasMore} />
    </Suspense>
  );
}

async function PriceTableWithMarkers({ item, prices, hasMore }: ItemPriceShellProps) {
  const [{ user }, markers] = await Promise.all([
    getServerCurrentUser(),
    loadItemPriceMarkers(
      item.internal_id,
      item.firstSeen,
      shouldShowTradeLists(item, await getCachedNow())
    ),
  ]);

  return (
    <PriceHistoryTable
      item={item}
      prices={prices}
      markers={markers}
      hasMore={hasMore}
      isAdmin={!!user?.isAdmin}
    />
  );
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

async function ItemPriceTradeableCard({ item, prices, hasMore }: ItemPriceShellProps) {
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
              itemId={item.internal_id}
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
                  <PriceTablePanel item={item} prices={prices} hasMore={hasMore} t={t} />
                </ItemPricePanel>
                <ItemPricePanel tab="chart">
                  <PriceChartPanel item={item} />
                </ItemPricePanel>
                {shouldShowLists && (
                  <ItemPricePanel tab="trading">
                    <ItemPriceListsPanel itemId={item.internal_id} type="trading" />
                  </ItemPricePanel>
                )}
                {shouldShowLists && (
                  <ItemPricePanel tab="seeking">
                    <ItemPriceListsPanel itemId={item.internal_id} type="seeking" />
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

  const { prices, hasMore } = await loadNPPricesSummary(item.internal_id);
  return <ItemPriceTradeableCard item={item} prices={prices} hasMore={hasMore} />;
}

export default ItemPriceSection;
