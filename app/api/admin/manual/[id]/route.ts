import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  getItemManualCheck,
  ManualCheckInputError,
  resolveManualCheck,
  type ResolveManualCheckRequest,
} from '../manualCheckService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) {
    return Response.json({ error: 'Bad Request' }, { status: 400 });
  }

  const data = await getItemManualCheck(itemId);
  return Response.json(data);
}

export async function POST(request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ResolveManualCheckRequest;
  try {
    body = (await request.json()) as ResolveManualCheckRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const itemId = Number(id);
    if (!Number.isFinite(itemId)) {
      return Response.json({ error: 'Bad Request' }, { status: 400 });
    }

    const result = await resolveManualCheck(itemId, body, user);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ManualCheckInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
