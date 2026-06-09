/**
 * NP Price — server orchestrator (item page).
 *
 * NP prices loaded via `loadNPPrices` in this section.
 * Card shell + price history render from fetched prices.
 * Price status, official list markers, admin controls, seeking/trading, and last seen stream via Suspense.
 * Client shell: ItemPriceCard.tsx
 */
import { Suspense, type ReactNode } from 'react';
import { Box, Center, Flex, Table, Text, Badge } from '@chakra-ui/react';
import Color from 'color';
import { MdMoneyOff } from 'react-icons/md';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { LuMinus } from 'react-icons/lu';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import CardBase from '@components/Card/CardBase';
import Markdown from '@components/Utils/Markdown';
import MatchTable from '@app/_components/Item/NCTrade/MatchTable';
import {
  loadLastSeen,
  getOfficialItemLists,
  loadNPPrices,
  loadPriceStatus,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { shouldShowTradeLists } from '@utils/utils';
import type { ItemData, PriceData, UserList } from '@types';
import {
  buildLastSeenCards,
  buildLastSeenStaticCards,
  buildPriceTableData,
  filterNPSeekingLists,
  filterNPTradingLists,
  getHelpNeededData,
  getLatestPrice,
  getNextPrice,
  getPercentChange,
  getPriceDiff,
  type PriceOrMarker,
} from '@app/_components/Item/Price/itemPriceUtils';
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
  PriceTableEditButton,
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

// --- Price table (server) ---

function getMarkerLabel(
  t: ItemPriceLabels['t'],
  markerType?: 'added-to' | 'available-at' | 'unavailable-at'
) {
  switch (markerType) {
    case 'added-to':
      return t('ItemPage.added-to');
    case 'available-at':
      return t('ItemPage.available-at');
    case 'unavailable-at':
      return t('ItemPage.unavailable-at');
    default:
      return '';
  }
}

function PriceTableRow({
  price,
  sortedData,
  index,
  isAdmin,
  itemColor,
  t,
  format,
}: {
  price: PriceOrMarker;
  sortedData: PriceOrMarker[];
  index: number;
  isAdmin?: boolean;
  itemColor: string;
  t: ItemPriceLabels['t'];
  format: ItemPriceLabels['format'];
}) {
  const bgColor = index % 2 === 0 ? 'blackAlpha.400' : 'transparent';
  const nextPrice = getNextPrice(sortedData, index);

  if (price.marker) {
    const markerLabel = getMarkerLabel(t, price.markerType);
    return (
      <Table.Row h={42} bg={bgColor} borderLeft={`3px solid ${price.color}85`}>
        <Table.Cell colSpan={isAdmin ? 4 : 3} border={0}>
          <Flex flexFlow="column" alignItems="center" gap={2}>
            <Badge>{markerLabel}</Badge>
            <I18nLink href={`/lists/official/${price.slug}`} style={{ color: price.color }}>
              {price.title}
            </I18nLink>
            <Text fontSize="xs">
              {format.dateTime(new Date(price.addedAt!), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  if (price.value === 0) {
    return (
      <Table.Row h={50} bg={bgColor} border={0} borderLeft={`3px solid ${itemColor}`}>
        <Table.Cell colSpan={isAdmin ? 3 : 4}>
          <Flex flexFlow="column" alignItems="center" gap={2}>
            {format.dateTime(new Date(price.addedAt!), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            <Text textAlign="center" color="whiteAlpha.700">
              {t('ItemPage.unknown-price-msg')}
            </Text>
          </Flex>
        </Table.Cell>
        {isAdmin && (
          <Table.Cell px={1}>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
    );
  }

  if (price.isUnconfirmed) {
    return (
      <Table.Row h={50} bg={bgColor} border={0} borderLeft={`3px solid ${itemColor}`}>
        <Table.Cell colSpan={4}>
          <Flex flexFlow="column" alignItems="center" gap={2}>
            <Text textAlign="center">{t('ItemPage.unconfirmed-price')}</Text>
            <Text
              textAlign="center"
              color="whiteAlpha.700"
              maxW="90%"
              fontSize="sm"
              whiteSpace="normal"
            >
              {t('ItemPage.unconfirmed-price-text')}
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  return (
    <>
      <Table.Row
        bg={bgColor}
        border={0}
        borderLeft={price.color ? `3px solid ${price.color}85` : undefined}
      >
        <Table.Cell>
          <Flex alignItems="center">
            <Flex flexFlow="column">
              {price.inflated && (
                <Text fontWeight="bold" color="red.400">
                  {t('General.inflation')}!
                </Text>
              )}
              {format.number(price.value!)} NP
            </Flex>
          </Flex>
        </Table.Cell>
        <Table.Cell px={1}>
          {!!nextPrice?.value && (
            <Flex alignItems="center">
              {!!(price.value! - nextPrice.value) && (
                <Flex
                  display="inline-flex"
                  flexFlow="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  {price.value! - nextPrice.value > 0 && <FaCaretUp color="#68D391" size={22} />}
                  {price.value! - nextPrice.value < 0 && <FaCaretDown color="#FC8181" size={22} />}
                </Flex>
              )}
              {!(price.value! - nextPrice.value) && (
                <LuMinus size={16} style={{ marginRight: 4, display: 'inline-block' }} />
              )}
              <Text>{format.number(price.value! - nextPrice.value)} NP</Text>
              <Text
                ml={1}
                fontSize="0.55rem"
                color={price.value! > nextPrice.value ? 'green.100' : 'red.200'}
                opacity={0.8}
              >
                {getPercentChange(price.value!, nextPrice.value!)}%
              </Text>
            </Flex>
          )}
        </Table.Cell>
        <Table.Cell px={1}>
          {format.dateTime(new Date(price.addedAt!), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Table.Cell>
        {isAdmin && (
          <Table.Cell px={1}>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
      {!!price.context && (
        <Table.Row bg={bgColor} border={0}>
          <Table.Cell colSpan={4}>
            <Box
              whiteSpace="normal"
              fontSize="0.8rem"
              color="whiteAlpha.700"
              textAlign="center"
              bg="blackAlpha.300"
              p={1}
              borderRadius="md"
            >
              <Text fontWeight="bold" mb={2}>
                {t('ItemPage.price-context')}
              </Text>
              <Markdown>{price.context}</Markdown>
            </Box>
          </Table.Cell>
        </Table.Row>
      )}
    </>
  );
}

function PriceTableView({
  data,
  lists,
  isAdmin,
  item,
  t,
  format,
}: {
  data: PriceData[];
  lists?: UserList[];
  isAdmin?: boolean;
  item: ItemData;
  t: ItemPriceLabels['t'];
  format: ItemPriceLabels['format'];
}) {
  const sortedData = buildPriceTableData(data, lists, item);
  const linkColor = Color(item.color.hex).alpha(0.8).lightness(70).hexa();

  return (
    <Table.ScrollArea
      minH={{ base: 100 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
      css={{ '& a': { color: linkColor } }}
    >
      <Table.Root h="100%" size="sm" css={{ '& td': { border: 0 } }}>
        <Table.Body>
          {sortedData.map((price, index) => (
            <PriceTableRow
              key={price.addedAt + '_item' + (price.marker ? '_marker' : '')}
              price={price}
              sortedData={sortedData}
              index={index}
              isAdmin={isAdmin}
              itemColor={item.color.hex}
              t={t}
              format={format}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

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
      <Suspense fallback={<PriceTableView item={item} data={prices} t={t} format={format} />}>
        <PriceTableTabFull item={item} prices={prices} t={t} format={format} />
      </Suspense>
    </Box>
  );
}

async function PriceTableTabFull({
  item,
  prices,
  t,
  format,
}: ItemProps & ItemPriceShellProps & ItemPriceLabels) {
  const [{ user }, lists] = await Promise.all([
    getServerCurrentUser(),
    getOfficialItemLists(item.internal_id, shouldShowTradeLists(item)),
  ]);

  return (
    <PriceTableView
      item={item}
      data={prices}
      lists={lists}
      isAdmin={!!user?.isAdmin}
      t={t}
      format={format}
    />
  );
}

async function PriceChartTabFull({ item, prices }: ItemProps & ItemPriceShellProps) {
  const lists = await getOfficialItemLists(item.internal_id, shouldShowTradeLists(item));

  return <PriceChartPanel item={item} prices={prices} lists={lists} />;
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
  const tradeLists = await loadTradeLists(item);
  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <MatchTable data={filterNPSeekingLists(tradeLists)} matches={null} type="seeking" />
    </Box>
  );
}

async function NPTradingTab({ item }: ItemProps) {
  const tradeLists = await loadTradeLists(item);
  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <MatchTable data={filterNPTradingLists(tradeLists)} matches={null} type="trading" />
    </Box>
  );
}

async function LastSeenStats({ item }: ItemProps) {
  const [lastSeen, t, format] = await Promise.all([
    loadLastSeen(item.internal_id),
    getTranslations(),
    getFormatter(),
  ]);
  return <LastSeenCards cards={buildLastSeenCards(item, lastSeen, t, format)} />;
}

// --- Orchestrator ---

function ItemPriceModalShell({ item, children }: ItemProps & { children: ReactNode }) {
  return (
    <ItemPriceModalProvider item={item} priceStatus={null}>
      {children}
    </ItemPriceModalProvider>
  );
}

async function ItemPriceTradeableCard({ item, prices }: ItemPriceShellProps) {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const shouldShowLists = shouldShowTradeLists(item);
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
