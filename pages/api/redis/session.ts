import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@utils/redis';
import { Chance } from 'chance';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return GET(req, res);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!redis) return res.json(true);

  const checkOnly = req.query.checkOnly === 'true';

  const sessionId = (req.headers['idb-session-id'] as string) || '';

  const sessionData = await redis.get(sessionId);

  if (sessionData) return res.status(200).json(sessionId);

  if (checkOnly) {
    return res.status(401).json({ error: 'Session not found' });
  }

  const newSessionId = generateSessionId();
  await redis.set(newSessionId, 'true', 'EX', 20 * 60); // Set session with 60 minutes expiration

  return res.status(200).json(newSessionId);
};

const generateSessionId = () => {
  const chance = new Chance();
  return chance.guid({ version: 5 });
};

export const checkSession = async (sessionToken?: string) => {
  if (!redis) return true;

  if (!sessionToken) return false;

  const sessionData = await redis.get(sessionToken);
  return !!sessionData;
};
