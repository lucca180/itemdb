/**
 * NC Trade — server orchestrator (item page).
 *
 * Loading strategy:
 * - Insights preloaded in `loadItemPage` (blocks page render)
 * - Card shell and tab buttons render immediately
 * - Seeking panel content blocks (Suspense)
 * - Trading, owls history, and owls tab label stream in parallel
 */
import { cache } from 'react';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Center, Icon, Text } from '@chakra-ui/react';
import { TbGiftOff } from 'react-icons/tb';
import { getTranslations } from 'next-intl/server';
import CardBase from '@components/Card/CardBase';
import MatchTable from '@components/NCTrades/MatchTable';
import NCTradeHistory from '@components/NCTrades/NCTradeHistory';
import { TradeInsights } from '@components/NCTrades/TradeInsights';
import {
  filterSeekingLists,
  filterTradingLists,
} from '@app/_components/Item/NCTrade/ncTradeListFilters';
import { NCTradeCard, NCTradePanelSkeleton } from '@app/_components/Item/NCTrade/NCTradeCard';
import { hasNCTradeInsights, loadLebronTradeHistory } from '@app/_components/Item/loadUtils';
import { getListMatchesMany } from '@pages/api/v1/lists/match/many';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import type { InsightsResponse, ItemData, UserList } from '@types';

type Props = {
  item: ItemData;
  tradeLists?: UserList[];
  insights: InsightsResponse | null;
};

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

async function NCTradeSeekingTab({ tradeLists }: Pick<Props, 'tradeLists'>) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const seeking = filterSeekingLists(tradeLists);
  const matches = await loadSeekingMatches(tradeLists, sessionCookie);
  return <MatchTable data={seeking} matches={matches} type="seeking" />;
}

async function NCTradeTradingTab({ tradeLists }: Pick<Props, 'tradeLists'>) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const trading = filterTradingLists(tradeLists);
  const matches = await loadTradingMatches(tradeLists, sessionCookie);
  return <MatchTable data={trading} matches={matches} type="trading" />;
}

async function NCTradeHistoryTab({ item }: Pick<Props, 'item'>) {
  const lebronTradeHistory = await loadLebronTradeHistory(item.name);
  return <NCTradeHistory item={item} ncTrades={lebronTradeHistory} tradeHistory={[]} />;
}

async function NCTradeOwlsTabLabel({ item }: Pick<Props, 'item'>) {
  const [lebronTradeHistory, t] = await Promise.all([
    loadLebronTradeHistory(item.name),
    getTranslations(),
  ]);
  const tradeCount = Math.min(lebronTradeHistory.length, 20).toString();

  return (
    <span>
      {tradeCount} {t('ItemPage.owls-trades')}
    </span>
  );
}

export function NCTradeSection({ item, tradeLists, insights }: Props) {
  if (!item.isNC) return null;

  const hasInsights = hasNCTradeInsights(insights);

  if (item.status === 'no trade') {
    if (!hasInsights || !insights) {
      return <NCTradeNoTradeCard item={item} />;
    }

    return (
      <NCTradeCard
        item={item}
        isNoTrade
        hasInsights
        defaultTab="insights"
        insightsPanel={<TradeInsights item={item} insights={insights} />}
      />
    );
  }

  return (
    <NCTradeCard
      item={item}
      lists={tradeLists}
      hasInsights={hasInsights}
      defaultTab={hasInsights ? 'insights' : 'seeking'}
      insightsPanel={
        hasInsights && insights ? <TradeInsights item={item} insights={insights} /> : undefined
      }
      seekingPanel={
        <Suspense fallback={<NCTradePanelSkeleton />}>
          <NCTradeSeekingTab tradeLists={tradeLists} />
        </Suspense>
      }
      tradingTab={
        <Suspense fallback={<NCTradePanelSkeleton />}>
          <NCTradeTradingTab tradeLists={tradeLists} />
        </Suspense>
      }
      historyTab={
        <Suspense fallback={<NCTradePanelSkeleton />}>
          <NCTradeHistoryTab item={item} />
        </Suspense>
      }
      owlsTabLabel={
        <Suspense fallback={<span>…</span>}>
          <NCTradeOwlsTabLabel item={item} />
        </Suspense>
      }
    />
  );
}

async function NCTradeNoTradeCard({ item }: Pick<Props, 'item'>) {
  const t = await getTranslations();

  return (
    <CardBase color={item.color.rgb} title={t('ItemPage.nc-trade')}>
      <Center>
        <Icon as={TbGiftOff} boxSize="100px" opacity={0.4} />
      </Center>
      <Text textAlign="center">{t('ItemPage.not-tradeable')}</Text>
    </CardBase>
  );
}

export default NCTradeSection;
