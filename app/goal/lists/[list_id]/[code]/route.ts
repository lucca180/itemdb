import { decodeGoalConfig, isStampVariant, type GoalConfig } from '@utils/goalCounter/config';
import { getStampGoalData } from '@utils/goalCounter/stampGoalData';
import { renderStampGoal } from '@utils/goalCounter/renderStampGoal';
import { getCollectionGoalData } from '@utils/goalCounter/collectionGoalData';
import { renderCollectionGoal } from '@utils/goalCounter/renderCollectionGoal';

// Public goal counter image: `itemdb.com.br/goal/lists/<list_id>/<code>.png`.
// The URL is stable (users paste it on Neopets) and its content follows the list owner's progress,
// so it is rendered on demand and only cached by the browser and the CDN.
//
// The `.png` suffix is required: proxy.ts lets paths with a file extension skip i18n routing.
// The code's variant decides the kind: stamp album variants or collection checklist variants.
// A code for the wrong kind of list is a 404.

const CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

const notFound = () =>
  new Response('Not found', { status: 404, headers: { 'Cache-Control': CACHE_CONTROL } });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ list_id: string; code: string }> }
) {
  const { list_id, code } = await params;

  const listId = Number(list_id);
  if (!Number.isSafeInteger(listId) || listId <= 0) return notFound();

  const match = code.match(/^([0-9a-z]{3}|[0-9a-z]{6})\.png$/i);
  const config = match ? decodeGoalConfig(match[1].toLowerCase()) : null;
  if (!config) return notFound();

  try {
    const png = await render(listId, config);
    if (!png) return notFound();

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': png.length.toString(),
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch (e) {
    console.error(`[goal-counter] failed for list ${listId} (${code})`, e);
    return new Response('Failed to generate goal counter', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

async function render(listId: number, config: GoalConfig): Promise<Buffer | null> {
  if (isStampVariant(config.variant)) {
    const data = await getStampGoalData(listId);
    return data ? renderStampGoal(data, config) : null;
  }

  const data = await getCollectionGoalData(listId);
  return data ? renderCollectionGoal(data, config) : null;
}
