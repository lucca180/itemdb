import pMap from 'p-map';
import prisma from '@utils/prisma';
import type { TradeData } from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { LogService } from '@services/ActionLogService';
import {
  autoApproveTradeFeedback,
  checkTradeFeedback,
  isTradeAutoApproveEnabled,
} from '@services/feedback/tradeAutoApprove';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const SAMPLE_SIZE = 20;

type Body = { dryRun?: boolean; limit?: number; afterId?: number };

/**
 * Runs the trade price auto approval over the pending vote queue, one page at a time
 * (`afterId` = `nextAfterId` of the previous call). Dry run by default.
 */
export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = ((await request.json().catch(() => ({}))) ?? {}) as Body;
  const dryRun = body.dryRun !== false;
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const afterId = Math.max(Number(body.afterId) || 0, 0);

  if (!dryRun && !isTradeAutoApproveEnabled())
    return Response.json(
      { error: 'Auto approve is disabled (TRADE_AUTO_APPROVE=off)' },
      { status: 409 }
    );

  // processedAt set on a pending feedback = a commit is in progress
  const pending = await prisma.feedbacks.findMany({
    where: {
      type: 'tradePrice',
      processed: false,
      processedAt: null,
      feedback_id: { gt: afterId },
    },
    orderBy: { feedback_id: 'asc' },
    take: limit,
    select: { feedback_id: true, json: true },
  });

  const result = {
    dryRun,
    scanned: pending.length,
    matched: 0,
    approved: 0,
    mismatched: 0,
    abstained: {} as Record<string, number>,
    errors: [] as { feedback_id: number; error: string }[],
    sample: [] as {
      feedback_id: number;
      wishlist: string;
      sent: (number | null)[];
      reason: string;
    }[],
    nextAfterId: pending.length === limit ? pending[pending.length - 1].feedback_id : null,
  };

  await pMap(
    pending,
    async ({ feedback_id, json }) => {
      try {
        const trade = JSON.parse(json as string)?.content?.trade as TradeData | undefined;
        if (!trade?.items?.length) return;

        const check = await checkTradeFeedback(trade);
        if (!('prices' in check.expected)) {
          const reason = check.expected.abstain;
          result.abstained[reason] = (result.abstained[reason] ?? 0) + 1;
          return;
        }
        if (!check.match) {
          result.mismatched++;
          return;
        }

        result.matched++;
        if (result.sample.length < SAMPLE_SIZE)
          result.sample.push({
            feedback_id,
            wishlist: trade.wishlist,
            sent: check.sent,
            reason: check.expected.reason,
          });

        if (!dryRun && (await autoApproveTradeFeedback(feedback_id))) result.approved++;
      } catch (e) {
        result.errors.push({ feedback_id, error: e instanceof Error ? e.message : String(e) });
      }
    },
    { concurrency: 2 }
  );

  if (!dryRun && result.approved) {
    try {
      await LogService.createLog(
        'tradeAutoApproveBackfill',
        { approved: result.approved, afterId, nextAfterId: result.nextAfterId },
        String(afterId),
        user.id
      );
    } catch (logError) {
      console.error('tradeAutoApproveBackfill log failed', logError);
    }
  }

  return Response.json(result);
}
