import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../utils/googleCloud';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const { session, skipUser } = req.body;
    console.time('checkSession');
    const authRes = await CheckAuth(null, undefined, session, !!skipUser);
    console.timeEnd('checkSession');

    return res.json({ authRes });
  } catch (e: any) {
    console.error(e);
    res.json(null);
  }
}
