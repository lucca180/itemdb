import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  previewPriceContextTargets,
  PriceContextInputError,
  PriceContextPreviewRequest,
} from '../priceContextService';

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PriceContextPreviewRequest;
  try {
    body = (await request.json()) as PriceContextPreviewRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const rows = await previewPriceContextTargets(body);
    return Response.json({
      rows,
      count: rows.length,
      targets: rows.filter((row) => row.price).length,
    });
  } catch (error) {
    if (error instanceof PriceContextInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
