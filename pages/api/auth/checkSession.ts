import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const { session, skipUser } = req.body;
    const authRes = await CheckAuth(null, undefined, session, !!skipUser);

    return res.json({ authRes });
  } catch (e: any) {
    res.json(null);
  }
}
