import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getItemDropSources } from '@utils/item/itemDropSources';

type RouteContext = {
  params: Promise<{ iid: string }>;
};

/**
 * Admin-only: where each drop row of a parent item comes from (manual, sync or community).
 * Used by the drops tab of the Edit Item modal; edits go through PATCH /api/v1/items/[id]/drops.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { iid } = await context.params;
  const parentIid = Number(iid);
  if (!Number.isInteger(parentIid) || parentIid <= 0) {
    return Response.json({ error: 'Invalid item id' }, { status: 400 });
  }

  try {
    const sources = await getItemDropSources(parentIid);
    return Response.json({ sources });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
