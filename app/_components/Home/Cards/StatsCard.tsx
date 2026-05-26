import { cookies } from 'next/headers';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getBetaStats } from '@pages/api/v1/beta';
import {
  StatsCardContent,
  StatsCardLoading,
  type StatsCardData,
  type StatsCardLoadingProps,
} from '@components/Home/StatsCard';

const StatsCard = async () => {
  const t = await getTranslations();
  const format = await getFormatter();
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const stats = await getBetaStats(session).catch(() => null);

  const completionPercentage =
    stats && stats.itemsTotal > 0
      ? (((stats.itemsTotal - stats.itemsMissingInfo) / stats.itemsTotal) * 100).toFixed(0)
      : null;

  const data: StatsCardData = {
    itemsTotal: !stats ? null : format.number(stats.itemsTotal),
    completionPercentage: !completionPercentage ? null : `${completionPercentage}%`,
    itemToProcess: !stats ? null : format.number(stats.itemToProcess),
    tradeQueue: !stats ? null : format.number(stats.tradeQueue),
    feedbackVoting: !stats ? null : format.number(stats.feedbackVoting),
  };

  return <StatsCardContent data={data} labels={getStatsCardLabels(t)} />;
};

export default StatsCard;

export { StatsCardLoading };

function getStatsCardLabels(t: Awaited<ReturnType<typeof getTranslations>>): StatsCardLoadingProps {
  return {
    itemsInDbLabel: t('BetaStats.items-in-db'),
    completeItemsLabel: t('BetaStats.complete-items'),
    processQueueLabel: t('BetaStats.process-queue'),
    tradePricingQueueLabel: t('BetaStats.trade-pricing-queue'),
    feedbackVotingQueueLabel: t('BetaStats.feedback-voting-queue'),
  };
}
