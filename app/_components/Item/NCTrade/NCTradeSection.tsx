/**
 * NC Trade — server orchestrator (item page).
 *
 * Server shell (CardBase, badge, panels). Client islands: tab bar + panel visibility.
 *
 * Loading strategy:
 * - Insights loaded via `loadNCTradeInsights` in this section
 * - Seeking panel content blocks (Suspense)
 * - Trading, owls history, and owls tab label stream in parallel
 */
import { cache } from 'react';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Badge, Center, Flex, Link, Stat, Text } from '@chakra-ui/react';
import { TbGiftOff } from 'react-icons/tb';
import { getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import CardBase from '@components/Card/CardBase';
import MatchTable from '@app/_components/Item/NCTrade/MatchTable';
import NCTradeHistory from '@app/_components/Item/NCTrade/NCTradeHistory';
import TradeInsights from '@app/_components/Item/NCTrade/TradeInsights';
import {
  filterSeekingLists,
  filterTradingLists,
} from '@app/_components/Item/NCTrade/ncTradeListFilters';
import { NCTradePanel } from '@app/_components/Item/NCTrade/NCTradePanel';
import { NCTradePanelSkeleton } from '@app/_components/Item/NCTrade/NCTradePanelSkeleton';
import { NCTradeTabBar } from '@app/_components/Item/NCTrade/NCTradeTabBar';
import { NCTradeTabProvider } from '@app/_components/Item/NCTrade/NCTradeTabContext';
import { NCTradeValueBadge } from '@app/_components/Item/NCTrade/NCTradeValueBadge';
import {
  loadLebronTradeHistory,
  loadNCTradeInsights,
  loadTradeLists,
} from '@app/_components/Item/loadUtils';
import { getListMatchesMany } from '@pages/api/v1/lists/match/many';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import type { InsightsResponse, ItemData, UserList } from '@types';

type Props = {
  item: ItemData;
};

function hasNCTradeInsights(insights: InsightsResponse | null | undefined) {
  if (!insights) return false;
  return insights.releases.length > 0 || insights.ncEvents.length > 0;
}

const loadSeekingMatches = cache(
  async (tradeLists: UserList[] | undefined, sessionCookie?: string) => {
    const { user } = await getServerCurrentUser();
    if (!user?.username) return null;

    const usernames = filterSeekingLists(tradeLists)
      .map((list) => list.owner?.username)
      .filter((username): username is string => !!username);

    if (!usernames.length) return {};
    return getListMatchesMany(user.username, usernames, 'seeker', sessionCookie);
  }
);

const loadTradingMatches = cache(
  async (tradeLists: UserList[] | undefined, sessionCookie?: string) => {
    const { user } = await getServerCurrentUser();
    if (!user?.username) return null;

    const usernames = filterTradingLists(tradeLists)
      .map((list) => list.owner?.username)
      .filter((username): username is string => !!username);

    if (!usernames.length) return {};
    return getListMatchesMany(user.username, usernames, 'offerer', sessionCookie);
  }
);

async function NCTradeSeekingTab({ tradeLists }: { tradeLists: UserList[] }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const seeking = filterSeekingLists(tradeLists);
  const matches = await loadSeekingMatches(tradeLists, sessionCookie);
  return <MatchTable data={seeking} matches={matches} type="seeking" />;
}

async function NCTradeTradingTab({ tradeLists }: { tradeLists: UserList[] }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const trading = filterTradingLists(tradeLists);
  const matches = await loadTradingMatches(tradeLists, sessionCookie);
  return <MatchTable data={trading} matches={matches} type="trading" />;
}

async function NCTradeHistoryTab({ item }: Pick<Props, 'item'>) {
  const lebronTradeHistory = await loadLebronTradeHistory(item.internal_id, item.name);
  return <NCTradeHistory item={item} ncTrades={lebronTradeHistory} tradeHistory={[]} />;
}

async function NCTradeOwlsTabLabel({ item }: Pick<Props, 'item'>) {
  const [lebronTradeHistory, t] = await Promise.all([
    loadLebronTradeHistory(item.internal_id, item.name),
    getTranslations(),
  ]);
  const tradeCount = Math.min(lebronTradeHistory.length, 20).toString();

  return (
    <span>
      {tradeCount} {t('ItemPage.owls-trades')}
    </span>
  );
}

async function NCTradeOwlsCta() {
  const t = await getTranslations();

  return (
    <Text fontSize="xs" textAlign="center" justifySelf="flex-end" color="whiteAlpha.600" mt={1}>
      {t.rich('ItemPage.report-owls-cta', {
        Link: (chunk) => (
          <Link asChild color="whiteAlpha.800">
            <I18nLink href="/mall/report?utm_content=owls-cta">{chunk}</I18nLink>
          </Link>
        ),
      })}
    </Text>
  );
}

async function NCTradeNoTradeBadge() {
  const t = await getTranslations();

  return (
    <Badge
      colorPalette="gray"
      fontSize="xs"
      minW="15%"
      maxW={{ base: '100%', md: '25%' }}
      whiteSpace="normal"
      textTransform="initial"
      alignSelf="center"
      borderRadius="md"
    >
      <Stat.Root
        flex="initial"
        justifyContent="center"
        alignItems="center"
        w="full"
        textAlign="center"
      >
        <Stat.Label>
          <TbGiftOff size={24} style={{ marginTop: '0.5rem' }} />
        </Stat.Label>
        <Stat.ValueText mb={1}>{t('ItemPage.no-trade')}</Stat.ValueText>
        <Stat.HelpText fontSize="xs" mt={0} fontWeight="medium">
          {t('ItemPage.no-trade-help-text')}
        </Stat.HelpText>
      </Stat.Root>
    </Badge>
  );
}

async function NCTradeTradeableCard({
  item,
  tradeLists,
  insights,
  hasInsights,
}: {
  item: ItemData;
  tradeLists: UserList[];
  insights: InsightsResponse | null;
  hasInsights: boolean;
}) {
  const t = await getTranslations();
  const seeking = filterSeekingLists(tradeLists);
  const trading = filterTradingLists(tradeLists);
  const defaultTab = hasInsights ? 'insights' : 'seeking';

  return (
    <NCTradeTabProvider defaultTab={defaultTab}>
      <CardBase title={t('ItemPage.nc-trade')} color={item.color.rgb}>
        <Flex flexFlow="column" minH="200px">
          <NCTradeTabBar
            hasInsights={hasInsights}
            seekingCount={seeking.length}
            tradingCount={trading.length}
            labels={{
              insights: t('ItemPage.insights'),
              seeking: t('ItemPage.seeking'),
              trading: t('ItemPage.trading'),
              owlsFallback: t('ItemPage.owls-trades'),
            }}
            owlsTabLabel={
              <Suspense fallback={<span>…</span>}>
                <NCTradeOwlsTabLabel item={item} />
              </Suspense>
            }
          />
          <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
            <NCTradeValueBadge item={item} />
            <Flex flexFlow="column" flex="1" overflow="hidden">
              {hasInsights && insights && (
                <NCTradePanel tab="insights">
                  <TradeInsights item={item} insights={insights} />
                </NCTradePanel>
              )}
              <NCTradePanel tab="seeking">
                <Suspense fallback={<NCTradePanelSkeleton />}>
                  <NCTradeSeekingTab tradeLists={tradeLists} />
                </Suspense>
              </NCTradePanel>
              <NCTradePanel tab="trading">
                <Suspense fallback={<NCTradePanelSkeleton />}>
                  <NCTradeTradingTab tradeLists={tradeLists} />
                </Suspense>
              </NCTradePanel>
              <NCTradePanel tab="ncTrading">
                <Suspense fallback={<NCTradePanelSkeleton />}>
                  <NCTradeHistoryTab item={item} />
                </Suspense>
              </NCTradePanel>
            </Flex>
          </Flex>
          <NCTradeOwlsCta />
        </Flex>
      </CardBase>
    </NCTradeTabProvider>
  );
}

export async function NCTradeSection({ item }: Props) {
  if (!item.isNC) return null;

  const [tradeLists, insights] = await Promise.all([
    loadTradeLists(item),
    loadNCTradeInsights(item.internal_id),
  ]);
  const hasInsights = hasNCTradeInsights(insights);

  if (item.status === 'no trade') {
    if (!hasInsights || !insights) {
      return <NCTradeNoTradeCard item={item} />;
    }

    const t = await getTranslations();

    return (
      <CardBase color={item.color.rgb} title={t('ItemPage.nc-trade')}>
        <Flex flexFlow="column" minH="auto">
          <Flex flex={1} flexFlow={{ base: 'column', md: 'row' }} gap={3}>
            <NCTradeNoTradeBadge />
            <Flex flexFlow="column" flex="1" overflow="hidden">
              <TradeInsights item={item} insights={insights} />
            </Flex>
          </Flex>
        </Flex>
      </CardBase>
    );
  }

  return (
    <NCTradeTradeableCard
      item={item}
      tradeLists={tradeLists}
      insights={insights}
      hasInsights={hasInsights}
    />
  );
}

async function NCTradeNoTradeCard({ item }: Pick<Props, 'item'>) {
  const t = await getTranslations();

  return (
    <CardBase color={item.color.rgb} title={t('ItemPage.nc-trade')}>
      <Center>
        <TbGiftOff size={100} opacity={0.4} />
      </Center>
      <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
    </CardBase>
  );
}

export default NCTradeSection;
