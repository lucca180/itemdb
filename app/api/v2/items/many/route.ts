import { getManyItemsV2, type FindManyItemsV2Query } from '@app/server/items/v2';
import { parseItemIntent } from '@types';
import { parseManyItemsV2Query, parseManyItemsV2SearchParams } from '@app/api/v2/items/parse';

const MANY_LIMIT = 10_000;

async function handleMany(raw: Record<string, unknown>) {
  const intent = parseItemIntent(raw.intent, 'minimal');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const query = parseManyItemsV2Query(raw);
  if (!query) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const items = await getManyItemsV2(query as FindManyItemsV2Query, {
    intent,
    limit: MANY_LIMIT,
  });

  return Response.json(items);
}

export async function GET(request: Request) {
  return handleMany(parseManyItemsV2SearchParams(request.url));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  return handleMany(body);
}
