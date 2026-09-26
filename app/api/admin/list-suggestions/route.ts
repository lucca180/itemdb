import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { resolveSuggestions, SuggestionInputError } from '@services/list/listSuggestions';

/**
 * Admin-only: approve/reject pending official list suggestions (ListSuggestionsDashboardClient).
 * Body: `{ listId, itemIids, action: 'approve' | 'reject' }`.
 * Only handles auth + JSON parsing; `resolveSuggestions` validates the body.
 */
type ResolveSuggestionsBody = {
  listId?: unknown;
  itemIids?: unknown;
  action?: unknown;
};

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ResolveSuggestionsBody;
  try {
    body = (await request.json()) as ResolveSuggestionsBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await resolveSuggestions({
      listId: body.listId,
      itemIids: body.itemIids,
      action: body.action,
      admin: user,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SuggestionInputError) {
      return Response.json({ error: error.code }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
