import axios from 'axios';
import { parseDyeworksHtml, type DyeworksSnapshotItem } from '@utils/dyeworks/parseCategories';

const DYEWORKS_URL = 'https://www.neopets.com/mall/dyeworks/';

const NEO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const neoHeaders = {
  'User-Agent': NEO_UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  origin: 'https://www.neopets.com',
  Referer: 'https://www.neopets.com/mall/',
};

type NeopetsProxyResponse = {
  status: number;
  url: string;
  headers?: Record<string, string>;
  body: string;
};

/**
 * Fetch Dyeworks HTML via Tarnum HTTP proxy (`POST /neopets/fetch`) and parse
 * the embedded `categories` object into base items currently available to dye.
 */
export async function fetchDyeworksSnapshot(tarnumServer: string): Promise<DyeworksSnapshotItem[]> {
  const res = await axios.post<NeopetsProxyResponse>(
    `${tarnumServer.replace(/\/$/, '')}/neopets/fetch`,
    {
      url: DYEWORKS_URL,
      method: 'GET',
      headers: neoHeaders,
    },
    {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const payload = res.data;
  if (!payload || payload.status !== 200) {
    throw new Error(`dyeworks proxy upstream ${payload?.status ?? 'unknown'}`);
  }

  const html = typeof payload.body === 'string' ? payload.body : String(payload.body ?? '');
  return parseDyeworksHtml(html);
}
