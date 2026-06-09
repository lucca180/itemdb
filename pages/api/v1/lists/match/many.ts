import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export type ListMatchTargetType = 'seeker' | 'offerer';

export async function getListMatchesMany(
  target: string,
  users: string[],
  targetType: ListMatchTargetType = 'seeker',
  sessionCookie?: string
): Promise<Record<string, number[]>> {
  if (!target || !users.length) return {};

  let user = null;

  try {
    user = (await CheckAuth(null, undefined, sessionCookie)).user;
  } catch {}

  const reqIsTarget = user?.username === target;

  const [lists, targetLists] = await Promise.all([
    prisma.userList.findMany({
      where: {
        user: {
          username: {
            in: users,
            not: target,
          },
        },
        official: false,
        purpose: targetType === 'seeker' ? 'trading' : 'seeking',
        visibility: 'public',
      },
      select: {
        user_id: true,
        items: {
          where: {
            isHidden: false,
          },
          select: {
            item_iid: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.userList.findMany({
      where: {
        user: {
          username: target,
        },
        official: false,
        purpose: targetType === 'seeker' ? 'seeking' : 'trading',
        visibility: reqIsTarget ? undefined : 'public',
      },
      select: {
        items: {
          where: {
            isHidden: reqIsTarget ? undefined : false,
            item: {
              isNC: true,
            },
          },
          select: {
            item_iid: true,
          },
        },
      },
    }),
  ]);

  const targetItemsSet = new Set(
    targetLists.flatMap((list) => list.items.map((item) => item.item_iid))
  );

  const userMatch: Record<string, number[]> = {};

  for (const list of lists) {
    const match = list.items.filter((item) => targetItemsSet.has(item.item_iid));
    if (match.length > 0) {
      userMatch[list.user.username ?? list.user_id] = match.map((item) => item.item_iid);
    }
  }

  return userMatch;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { target, users, targetType } = req.body;
  if (!targetType) targetType = 'seeker';

  if (!target || !users || !Array.isArray(users) || Array.isArray(target)) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const sessionCookie = req.cookies?.session;
  const userMatch = await getListMatchesMany(target, users, targetType, sessionCookie);

  return res.status(200).json(userMatch);
}
