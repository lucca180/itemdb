import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { listManualMarkers } from './priceMarkersService';

export async function GET() {
  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const markers = await listManualMarkers();
    return Response.json({ markers, count: markers.length });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
