import prisma from '../../../utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Auth, CheckAuth } from '../../../utils/googleCloud';
import { LogService } from '@services/ActionLogService';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  try {
    const { confirmMail } = req.body;

    const { user } = await CheckAuth(req);
    if (!user) return res.status(404).json({ error: 'user not found' });

    if (user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    if (confirmMail !== user.email) return res.status(404).json({ error: 'user not found' });

    const olp = prisma.userList.updateMany({
      where: {
        user_id: user.id,
        official: true,
      },
      data: {
        user_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1', // itemdb_system account
      },
    });

    const tp = prisma.ncTrade.updateMany({
      where: { reporter_id: user.id },
      data: { reporter_id: 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1' },
    });

    const [ol, t] = await Promise.all([olp, tp]);

    await prisma.user.delete({
      where: { id: user.id },
    });

    await LogService.createLog(
      'deleteUser',
      {
        movedOfficialLists: ol.count,
        movedNcTrades: t.count,
      },
      user.id
    );

    Auth.revokeRefreshTokens(user.id).catch((e) => console.error('Error revoking tokens:', e));
    Auth.deleteUser(user.id).catch((e) => console.error('Error deleting auth user:', e));

    res.setHeader(
      'Set-Cookie',
      'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax;'
    );

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
