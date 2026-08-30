import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  AdminPricesInputError,
  createAdminPrice,
  processAdminPrices,
  type CreateAdminPriceRequest,
  type ProcessAdminPricesRequest,
} from './adminPricesService';

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateAdminPriceRequest;
  try {
    body = (await request.json()) as CreateAdminPriceRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const newPrice = await createAdminPrice(body);
    return Response.json(newPrice);
  } catch (error) {
    if (error instanceof AdminPricesInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ProcessAdminPricesRequest;
  try {
    body = (await request.json()) as ProcessAdminPricesRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await processAdminPrices(body);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AdminPricesInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
