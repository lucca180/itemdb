import { decodeGoalConfig, isStampVariant, type GoalConfig } from '@utils/goalCounter/config';
import { renderStampGoal } from '@utils/goalCounter/renderStampGoal';
import { renderCollectionGoal } from '@utils/goalCounter/renderCollectionGoal';
import { isGoalCollectionSlug } from '@utils/goalCounter/collections';
import {
  getStampSampleData,
  parseStampSample,
  sampleCollectionData,
} from '@utils/goalCounter/sampleData';

// Sample goal counter: `/goal/sample/<stamps-<album id> | collection slug>/<code>.png`.
// Fixed progress, the same for everyone with that album page or collection (used by the style
// thumbnails in the modal), so it is cached long; only the large preview hits the live
// `/goal/lists/...` route.
//
// The `.png` suffix is required: proxy.ts lets paths with a file extension skip i18n routing.

const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800';

const notFound = () =>
  new Response('Not found', { status: 404, headers: { 'Cache-Control': CACHE_CONTROL } });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sample: string; code: string }> }
) {
  const { sample, code } = await params;

  const match = code.match(/^([0-9a-z]{3}|[0-9a-z]{6})\.png$/i);
  const config = match ? decodeGoalConfig(match[1].toLowerCase()) : null;
  if (!config) return notFound();

  try {
    const png = await render(sample, config);
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
    console.error(`[goal-counter] sample failed (${sample}/${code})`, e);
    return new Response('Failed to generate goal counter', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

// a stamp code only makes sense on a stamp album sample, and vice versa
async function render(sample: string, config: GoalConfig): Promise<Buffer | null> {
  const albumListId = parseStampSample(sample);

  if (albumListId !== null) {
    if (!isStampVariant(config.variant)) return null;
    const data = await getStampSampleData(albumListId);
    return data ? renderStampGoal(data, config) : null;
  }

  if (isGoalCollectionSlug(sample) && !isStampVariant(config.variant)) {
    return renderCollectionGoal(sampleCollectionData(sample), config);
  }

  return null;
}
