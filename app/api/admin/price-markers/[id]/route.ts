import { LogService } from '@services/ActionLogService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  deleteManualMarker,
  ManualMarkerInputError,
  normalizeMarkerId,
  updateManualMarker,
  type ManualMarkerUpdateRequest,
} from '../priceMarkersService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: ManualMarkerUpdateRequest;
  try {
    body = (await request.json()) as ManualMarkerUpdateRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const markerId = normalizeMarkerId(id);
    const result = await updateManualMarker(markerId, body);
    await LogService.createLog(
      'manualPriceMarkerUpdate',
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
      const status = error.message === 'Marker not found' ? 404 : 400;
      return Response.json({ error: error.message }, { status });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const markerId = normalizeMarkerId(id);
    const result = await deleteManualMarker(markerId);
    await LogService.createLog(
      'manualPriceMarkerDelete',
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
      const status = error.message === 'Marker not found' ? 404 : 400;
      return Response.json({ error: error.message }, { status });
    }

    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
