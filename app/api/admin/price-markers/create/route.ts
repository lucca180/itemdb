import { LogService } from '@services/ActionLogService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  createManualMarker,
  ManualMarkerInputError,
  type ManualMarkerCreateRequest,
} from '../priceMarkersService';

export async function POST(request: Request) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ManualMarkerCreateRequest;
  try {
    body = (await request.json()) as ManualMarkerCreateRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await createManualMarker(body, user.id);
    await LogService.createLog(
      'manualPriceMarkerCreate',
      {
        markerId: result.marker.internal_id,
        itemIds: result.affectedItemIds,
        badgeText: result.marker.badgeText,
        title: result.marker.title,
        color: result.marker.color,
        startAt: result.marker.startAt,
        endAt: result.marker.endAt,
        isPoint: result.marker.isPoint,
      },
      String(result.marker.internal_id),
      user.id
    );

    return Response.json(result);
  } catch (error) {
    if (error instanceof ManualMarkerInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
