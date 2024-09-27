import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // target: username of the user whose list we want to match against
  // users: array of usernames of users whose lists we want to match
  // targetType: 'seeker' or 'offerer', defaults to 'seeker'
  let { target, users, targetType } = req.body;
  if (!targetType) targetType = 'seeker';

  if (!target || !users || !Array.isArray(users) || Array.isArray(target))
    return res.status(400).json({ error: 'Bad Request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  // If the user is not the target, they can only see public lists
  const reqIsTarget = user?.username === target;

  const lists = await prisma.userList.findMany({
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
    include: {
      items: {
        where: {
          isHidden: false,
        },
        include: {
          item: true,
        },
      },
      user: true,
    },
  });

  const targetLists = await prisma.userList.findMany({
    where: {
      user: {
        username: target,
      },
      official: false,
      purpose: targetType === 'seeker' ? 'seeking' : 'trading',
      visibility: reqIsTarget ? undefined : 'public',
    },
    include: {
      items: {
        where: {
          isHidden: reqIsTarget ? undefined : false,
        },
        include: {
          item: true,
        },
      },
    },
  });

  const targetItemsSet = new Set(
    targetLists.flatMap((list) =>
      list.items.filter((i) => i.item.isNC).map((item) => item.item_iid),
    ),
  );

  const userMatch: { [username: string]: number[] } = {};

  for (const list of lists) {
    const match = list.items.filter((item) => targetItemsSet.has(item.item_iid));
    if (match.length > 0) {
      userMatch[list.user.username ?? list.user_id] = match.map((item) => item.item_iid);
    }
  }

  return res.status(200).json(userMatch);
}
