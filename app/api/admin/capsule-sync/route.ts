import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { syncCapsuleContents } from '@utils/item/capsuleContentsSync';

type CapsuleSyncRequest = {
  itemId?: number;
};

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CapsuleSyncRequest;
  try {
    body = (await request.json()) as CapsuleSyncRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const itemId = Number(body.itemId);
  if (!itemId || isNaN(itemId)) {
    return Response.json({ error: 'itemId is required' }, { status: 400 });
  }

  const capsule = await prisma.items.findUnique({
    where: { item_id: itemId },
    select: { internal_id: true, item_id: true },
  });

  if (!capsule || !capsule.item_id) {
    return Response.json({ error: `No item found with item_id=${itemId}` }, { status: 404 });
  }

  try {
    const result = await syncCapsuleContents({
      internal_id: capsule.internal_id,
      item_id: capsule.item_id,
    });

    return Response.json(result);
  } catch (error) {
    console.error(`[admin/capsule-sync] failed for item_id=${itemId}`, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
