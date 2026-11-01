import pMap from 'p-map';
import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { LogService } from '@services/ActionLogService';
import {
  getTradeConfirmedBlank,
  isTradeBlankPrefilterEnabled,
} from '@services/feedback/tradeAutoApprove';
import { autoPriceTrades2 } from '@pages/api/v1/trades/autoPrice2';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const SAMPLE_SIZE = 20;

type Body = { dryRun?: boolean; limit?: number; afterId?: number };

/**
 * Runs the pricing queue (unprocessed trades) through the auto pricer again, one page at a time
 * (`afterId` = `nextAfterId` of the previous call), so the lots that are surely all blank leave
 * the queue. Dry run by default: lists what the blank pre-filter would close (the auto pricer may
 * still price some of them first, e.g. an Instant Buy on the lot's expensive item).
 */
export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = ((await request.json().catch(() => ({}))) ?? {}) as Body;
  const dryRun = body.dryRun !== false;
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const afterId = Math.max(Number(body.afterId) || 0, 0);

  if (!dryRun && !isTradeBlankPrefilterEnabled())
    return Response.json(
      { error: 'Blank pre-filter is disabled (TRADE_BLANK_PREFILTER=off)' },
      { status: 409 }
    );

  const trades = await prisma.trades.findMany({
    where: { processed: false, trade_id: { gt: afterId } },
    orderBy: { trade_id: 'asc' },
    take: limit,
    include: { items: true },
  });

  const result = {
    dryRun,
    scanned: trades.length,
    confirmedBlank: 0,
    byReason: {} as Record<string, number>,
    closed: 0,
    errors: [] as { trade_id: number; error: string }[],
    sample: [] as { trade_id: number; wishlist: string; reason: string }[],
    nextAfterId: trades.length === limit ? trades[trades.length - 1].trade_id : null,
  };

  await pMap(
    trades,
    async (trade) => {
      try {
        const reason = await getTradeConfirmedBlank(trade);
        if (!reason) return;

        result.confirmedBlank++;
        result.byReason[reason] = (result.byReason[reason] ?? 0) + 1;
        if (result.sample.length < SAMPLE_SIZE)
          result.sample.push({ trade_id: trade.trade_id, wishlist: trade.wishlist, reason });
      } catch (e) {
        result.errors.push({
          trade_id: trade.trade_id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    { concurrency: 2 }
  );

  if (dryRun || !trades.length) return Response.json(result);

  await autoPriceTrades2(trades);

  // anything the pipeline handled: priced, closed blank, or sent to the vote queue
  result.closed = await prisma.trades.count({
    where: { trade_id: { in: trades.map((t) => t.trade_id) }, processed: true },
  });

  try {
    await LogService.createLog(
      'tradeBlankPrefilterBackfill',
      { closed: result.closed, afterId, nextAfterId: result.nextAfterId },
      String(afterId),
      user.id
    );
  } catch (logError) {
    console.error('tradeBlankPrefilterBackfill log failed', logError);
  }

  return Response.json(result);
}
