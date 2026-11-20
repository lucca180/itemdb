import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  PriceContextSuggestionError,
  resolvePriceContextSuggestions,
} from '@services/PriceContextSuggestionService';

/**
 * Admin-only: approve/reject pending price context suggestions (Price context tab of
 * /admin/list-suggestions). Body: `{ priceId, action: 'approve' | 'reject', context? }`.
 * Only handles auth + JSON parsing; `resolvePriceContextSuggestions` validates the body.
 */
type ResolveBody = {
  priceId?: unknown;
  action?: unknown;
  context?: unknown;
};

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ResolveBody;
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await resolvePriceContextSuggestions({
      priceId: body.priceId,
      action: body.action,
      context: body.context,
      admin: user,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof PriceContextSuggestionError) {
      return Response.json({ error: error.code }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
