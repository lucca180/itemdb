import { LogService } from '@services/ActionLogService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  AdminTradeEditError,
  applyAdminTradeEdit,
  loadAdminTrade,
  type AdminTradeItemPrice,
} from '../adminTradeEdit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const parseTradeId = (id: string) => {
  const tradeId = Number(id);
  if (!Number.isFinite(tradeId) || tradeId <= 0) {
    throw new AdminTradeEditError('Invalid trade id', 400);
  }
  return tradeId;
};

/** Load a lot into the admin pricing editor. */
export async function GET(_request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const trade = await loadAdminTrade(parseTradeId(id));
    return Response.json({ trade });
  } catch (error) {
    if (error instanceof AdminTradeEditError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** Save prices + sync unprocessed PriceProcess2. Does not touch votes or XP. */
export async function PATCH(request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { items?: AdminTradeItemPrice[] };
  try {
    body = (await request.json()) as { items?: AdminTradeItemPrice[] };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const result = await applyAdminTradeEdit(parseTradeId(id), body.items ?? []);
    try {
      await LogService.createLog('adminEditTrade', result, String(result.trade_id), user.id);
    } catch (logError) {
      // Mutation already committed; a log failure must not look like a failed save.
      console.error('adminEditTrade log failed', logError);
    }

    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AdminTradeEditError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
