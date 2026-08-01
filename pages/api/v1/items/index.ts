import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';
import { getManyItems } from './many';
import { redis_setDataCount } from '@utils/api/redis';
import { validateExtractorHash } from '@utils/api/hashValidator';
import { enqueueItemsToProcess } from '@utils/item/enqueueItemProcess';
import prisma from '@utils/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  let limit = req.query.limit ? Number(req.query.limit) : 50;
  limit = Math.min(limit, 100);
  const includeOld = req.query.includeOld ? req.query.includeOld === 'true' : false;

  const items = await getLatestItems(limit, !includeOld);

  redis_setDataCount(items.length, req);

  return res.status(200).json(items);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const tarnumkey = req.headers['tarnumkey'] as string | undefined;
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const payload = data.payload ?? data;
  const items = payload.items;
  const lang = payload.lang;

  if (lang !== 'en') return res.status(400).json({ error: 'Language not supported' });

  const hashValidation = await validateExtractorHash({
    req,
    endpoint: 'items',
    hash: data.hash,
    payload: data.payload ?? { items },
    bypassKey: tarnumkey,
  });

  if (!hashValidation.valid) return res.status(400).json({ error: 'Invalid hash' });

  const meta = req.headers['itemdb-version'];
  if (!meta && hashValidation.mode !== 'bypass')
    return res.status(500).json({ error: 'Internal Server Error' });

  try {
    const result = await enqueueItemsToProcess(items, {
      language: lang,
      ipAddress: requestIp.getClientIp(req),
      meta: {
        itemdbVersion: (meta as string) || 'direct-api',
        dataSource: payload.dataSource || 'unknown',
      },
    });

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLatestItems = async (limit: number, skipOldIDs = false, onlyWearable = false) => {
  const result = await prisma.items.findMany({
    where: {
      canonical_id: null,
      OR: [{ item_id: null }, { item_id: { gte: skipOldIDs ? 85020 : 0 } }],
      isWearable: onlyWearable ? true : undefined,
    },
    orderBy: [
      {
        addedAt: 'desc',
      },
      {
        internal_id: 'asc',
      },
    ],
    select: {
      internal_id: true,
      addedAt: true,
    },
    take: limit,
  });

  const items = await getManyItems({
    id: result.map((data) => data.internal_id.toString()),
  });

  // sort by addedAt
  return Object.values(items).sort((a, b) => {
    return (
      result.findIndex((data) => data.internal_id === a.internal_id) -
      result.findIndex((data) => data.internal_id === b.internal_id)
    );
  });
};
