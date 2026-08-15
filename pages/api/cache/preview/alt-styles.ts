/**
 * CDN cache in front of DTI's alt-styles.json.
 *
 * Preview generation (pet styles especially) used to GET that catalog from
 * OpenNeo on every wearable miss — one large payload per token. Callers hit
 * this route instead so Cloudflare can reuse it (5 min fresh, 10 min SWR).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DTI_ALT_STYLES_URL = 'https://impress.openneo.net/species/0/alt-styles.json';

/** Production URL — preview consumers (including local dev) always hit CDN-cached origin. */
export const ITEMDB_ALT_STYLES_URL = 'https://itemdb.com.br/api/cache/preview/alt-styles';

const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const dtiRes = await axios.get(DTI_ALT_STYLES_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'itemdb (https://itemdb.com.br/;)',
      },
    });

    if (!Array.isArray(dtiRes.data)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Invalid alt-styles payload' });
    }

    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json(dtiRes.data);
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Failed to fetch alt-styles' });
  }
}
