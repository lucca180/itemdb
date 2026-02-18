import prisma from '@utils/prisma';
import jwt from 'jsonwebtoken';
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
  });

  if (!keyData) throw new Error('Invalid API key');

  const token = jwt.sign(
    {
      sub: keyData.key_id,
      limit: keyData.limit,
    },
    process.env.SITE_PROOF_SECRET!,
    {
      expiresIn: '1h',
      issuer: 'itemdb',
      audience: 'itemdb-api',
    }
  );

  return token;
};
