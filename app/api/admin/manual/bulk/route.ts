import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getItemManualCheck, resolveManualCheck } from '../manualCheckService';

type BulkRequest = {
  type?: unknown;
  action?: unknown;
  ids?: unknown;
};

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: BulkRequest;
  try {
    body = (await request.json()) as BulkRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, action, ids } = body;

  if (type !== 'info' || !['approve', 'reprove'].includes(String(action)) || !Array.isArray(ids)) {
    return Response.json({ error: 'Bad Request' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    ids.map(async (rawId) => {
      const itemId = Number(rawId);
      if (!Number.isFinite(itemId)) throw new Error(`Invalid id: ${rawId}`);

      const { info } = await getItemManualCheck(itemId);
      if (!info) throw new Error(`No pending check for item ${itemId}`);

      if (action === 'approve') {
        const conflictChange = info.changes.find((change) => change.field === info.conflictField);

        return resolveManualCheck(
          itemId,
          {
            type: 'info',
            action: 'approve',
            checkID: info.process.internal_id,
            correctInfo: conflictChange
              ? { field: info.conflictField, value: conflictChange.rawIncoming }
              : undefined,
          },
          user
        );
      }

      return resolveManualCheck(
        itemId,
        { type: 'info', action: 'reprove', checkID: info.process.internal_id },
        user
      );
    })
  );

  const succeeded = results.filter((result) => result.status === 'fulfilled').length;
  const failed = results.length - succeeded;
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => String(result.reason));

  return Response.json({ succeeded, failed, errors });
}
