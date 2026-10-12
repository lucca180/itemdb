import { decodeGoalConfig } from '@utils/goalCounter/config';
import { getStampGoalData } from '@utils/goalCounter/stampGoalData';
import { renderStampGoal } from '@utils/goalCounter/renderStampGoal';

// Public goal counter image: `itemdb.com.br/goal/lists/<list_id>/<code>.png`.
// The URL is stable (users paste it on Neopets) and its content follows the list owner's progress,
// so it is rendered on demand and only cached by the browser and the CDN.
//
// The `.png` suffix is required: proxy.ts lets paths with a file extension skip i18n routing.

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

  const match = code.match(/^([0-9a-z]{3})\.png$/i);
  const config = match ? decodeGoalConfig(match[1].toLowerCase()) : null;
  if (!config) return notFound();

  try {
    const data = await getStampGoalData(listId);
    if (!data) return notFound();

    const png = await renderStampGoal(data, config);

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
