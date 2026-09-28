import type { NextRequest } from 'next/server';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  listOpenableCandidates,
  markItemOpenable,
  OpenableReviewInputError,
  parseOpenableReviewDays,
} from '@services/OpenableReviewService';

/**
 * Admin-only openable review queue (OpenableReviewClient).
 * GET  `?days=7&all=1` — items not marked openable with community openings in the last `days`
 *      days (`all=1` also includes items whose drops card would not render).
 * POST `{ itemIid }` — marks the item as openable.
 * Only handles auth + parsing; OpenableReviewService validates the input.
 */
export async function GET(request: NextRequest) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  try {
    const result = await listOpenableCandidates({
      days: parseOpenableReviewDays(searchParams.get('days')),
      onlyWouldShowDrops: searchParams.get('all') !== '1',
    });

    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { itemIid?: unknown };
  try {
    body = (await request.json()) as { itemIid?: unknown };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await markItemOpenable({ itemIid: body.itemIid, admin: user });
    return Response.json(result);
  } catch (error) {
    if (error instanceof OpenableReviewInputError) {
      return Response.json({ error: error.code }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
