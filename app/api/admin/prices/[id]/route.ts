import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  AdminPricesInputError,
  AdminPricesNotFoundError,
  deleteAdminPrice,
  editAdminPrice,
  type EditAdminPriceRequest,
} from '../adminPricesService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parsePriceId(id: string): number {
  const priceId = Number(id);
  if (!Number.isFinite(priceId) || priceId <= 0) {
    throw new AdminPricesInputError('Invalid price id');
  }
  return priceId;
}

export async function POST(request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: EditAdminPriceRequest;
  try {
    body = (await request.json()) as EditAdminPriceRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const updated = await editAdminPrice(parsePriceId(id), body, user);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof AdminPricesInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AdminPricesNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await deleteAdminPrice(parsePriceId(id), user);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AdminPricesInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AdminPricesNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
