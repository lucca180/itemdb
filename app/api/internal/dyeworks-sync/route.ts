import { fetchDyeworksSnapshot } from '@utils/dyeworks/fetchCategories';
import { syncDyeworksLists } from '@utils/dyeworks/sync';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const auth = request.headers.get('authorization');
  return !!auth && auth === TARNUM_KEY;
}

async function syncDyeworks() {
  if (!TARNUM_SERVER) {
    return Response.json({ error: 'TARNUM_SERVER is not configured' }, { status: 500 });
  }

  try {
    const snapshot = await fetchDyeworksSnapshot(TARNUM_SERVER);
    if (snapshot.length === 0) {
      return Response.json({ error: 'Empty dyeworks snapshot' }, { status: 500 });
    }
    // return Response.json(snapshot, { status: 200 });
    const result = await syncDyeworksLists(snapshot);
    return Response.json(result);
  } catch (e) {
    console.error('[dyeworks-sync]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Dyeworks sync failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncDyeworks();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncDyeworks();
}
