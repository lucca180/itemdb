import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  loadPriceContextDropPools,
  loadPriceContextSourceItems,
  PriceContextInputError,
  PriceContextItemSourceRequest,
} from '../priceContextService';

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PriceContextItemSourceRequest;
  try {
    body = (await request.json()) as PriceContextItemSourceRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    if (body.source === 'dropPools') {
      const pools = await loadPriceContextDropPools(Number(body.parentItemId));
      return Response.json({
        pools,
        count: pools.length,
      });
    }

    const items = await loadPriceContextSourceItems(body);
    return Response.json({
      items: Object.values(items),
      count: Object.keys(items).length,
    });
  } catch (error) {
    if (error instanceof PriceContextInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
