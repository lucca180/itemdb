import prisma from '@utils/prisma';
import { signSiteToken } from '@utils/api/api-utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-itemdb-key'] as string | undefined;

  if (!apiKey) return res.status(400).json({ error: 'API key is required' });

  try {
    const token = await generateAPIToken(apiKey);
    return res.json({ token });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
}

export const generateAPIToken = async (apiKey: string) => {
  const keyData = await prisma.apiKeys.findFirst({
    where: {
      api_key: apiKey,
      active: true,
    },
    select: {
      key_id: true,
      limit: true,
    },
  });

  if (!keyData) throw new Error('Invalid API key');

  // jose types `sub` as string, but issued tokens carry the numeric key_id
  const token = await signSiteToken(
    {
      aud: 'itemdb.com.br',
      ctx: 'api-token',
      sub: keyData.key_id as unknown as string,
      limit: keyData.limit,
    },
    '1h'
  );

  return token;
};
