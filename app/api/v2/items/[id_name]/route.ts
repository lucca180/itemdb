import { getItemV2 } from '@app/server/items/v2';
import { parseItemIntent } from '@types';

type RouteContext = {
  params: Promise<{ id_name: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id_name } = await context.params;
  if (!id_name) {
    return Response.json({ error: 'Invalid Request' }, { status: 400 });
  }

  const intentParam = new URL(request.url).searchParams.get('intent');
  const intent = parseItemIntent(intentParam, 'minimal');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const idOrName = Number.isNaN(Number(id_name)) ? id_name : Number(id_name);
  const item = await getItemV2(idOrName, { intent });

  if (!item) {
    return Response.json({ error: 'Item not found' }, { status: 404 });
  }

  return Response.json(item);
}
