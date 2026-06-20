import { LogService } from '@services/ActionLogService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  applyPriceContext,
  PriceContextApplyRequest,
  PriceContextInputError,
} from '../priceContextService';

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PriceContextApplyRequest;
  try {
    body = (await request.json()) as PriceContextApplyRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await applyPriceContext(body);
    await LogService.createLog(
      result.operation === 'clear' ? 'bulkPriceContextClear' : 'bulkPriceContextApply',
      {
        itemIds: result.rows.map((row) => row.itemId),
        priceIds: result.rows.flatMap((row) => (row.price ? [row.price.internal_id] : [])),
        startDate: typeof body.startDate === 'string' ? body.startDate : null,
        operation: result.operation,
        priceContext:
          result.operation === 'clear'
            ? null
            : typeof body.priceContext === 'string'
              ? body.priceContext.trim()
              : null,
        onlyInflationAlerts: body.onlyInflationAlerts === true,
        updated: result.updated,
        skipped: result.skipped,
        skippedItems: result.rows
          .filter((row) => !row.price)
          .map((row) => ({
            itemId: row.itemId,
            reason: row.skippedReason,
          })),
      },
      undefined,
      user.id
    );

    return Response.json(result);
  } catch (error) {
    if (error instanceof PriceContextInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
