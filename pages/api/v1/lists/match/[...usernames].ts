import type { NextApiRequest, NextApiResponse } from 'next';
import { ListItemInfo } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { usernames, list_id } = req.query;

  if (!Array.isArray(usernames) || usernames.length < 2)
    return res.status(400).json({ error: 'Bad Request' });

  const [seeker, offerer] = usernames;
  try {
    const listMatch = await getListMatch(
      seeker as string,
      offerer as string,
      req,
      list_id ? (list_id as string) : undefined
    );

    return res.status(200).json(listMatch);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getListMatch = async (
  seeker: string,
  offerer: string,
  req: NextApiRequest,
  list_id?: string | number
) => {
  let requestUser = null;

  try {
    requestUser = (await CheckAuth(req)).user;
  } catch (e) {}
  const offerer_res = await prisma.user.findUnique({
    where: {
      username: offerer as string,
    },
  });

  const seeker_res = await prisma.user.findUnique({
    where: {
      username: seeker as string,
    },
  });

  if (!seeker_res || !offerer_res) throw new Error('User Not Found');

  const seeker_id = seeker_res.id;
  const offerer_id = offerer_res.id;

  if (list_id) {
    const initialList = await prisma.userList.findUnique({
      where: {
        internal_id: Number(list_id),
      },
      include: {
        items: {
          where: {
            isHidden: false,
          },
        },
      },
    });

    if (
      !initialList ||
      (initialList.visibility === 'private' && initialList.user_id !== requestUser?.id) ||
      (initialList.purpose == 'seeking' && initialList.user_id != seeker_id) ||
      (initialList.purpose == 'trading' && initialList.user_id != offerer_id)
    )
      throw new Error('List Not Found');

    const target_id = initialList.purpose == 'seeking' ? offerer_id : seeker_id;

    const matchList = await prisma.userList.findMany({
      where: {
        user_id: target_id as string,
        visibility: requestUser?.id === target_id ? undefined : 'public',
        purpose: initialList.purpose == 'seeking' ? 'trading' : 'seeking',
        official: false,
      },
      include: {
        items: {
          where: {
            isHidden: false,
          },
        },
      },
    });

    const matchListSet = new Set(matchList.flatMap((list) => list.items.map((i) => i.item_iid)));

    const matchedItems: ListItemInfo[] = initialList.items
      .filter((a) => matchListSet.has(a.item_iid))
      .map((item) => ({
        ...item,
        addedAt: item.addedAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        seriesStart: item.seriesStart?.toISOString() ?? null,
        seriesEnd: item.seriesEnd?.toISOString() ?? null,
      }));

    return matchedItems;
  }

  const offererLists = await prisma.userList.findMany({
    where: {
      user_id: offerer_id as string,
      visibility: requestUser?.id === offerer_id ? undefined : 'public',
      purpose: 'trading',
      official: false,
    },
    include: {
      items: {
        where: {
          isHidden: false,
        },
      },
    },
  });

  const seekerLists = await prisma.userList.findMany({
    where: {
      user_id: seeker_id as string,
      visibility: requestUser?.id === seeker_id ? undefined : 'public',
      purpose: 'seeking',
      official: false,
    },
    include: {
      items: {
        where: {
          isHidden: false,
        },
      },
    },
  });

  const offererItemsSet = new Set(
    offererLists.flatMap((list) => list.items.map((item) => item.item_iid))
  );

  const listMatch: { [list_id: number]: ListItemInfo[] } = {};

  seekerLists.flatMap((list) => {
    const x = list.items.filter((item) => offererItemsSet.has(item.item_iid));

    const match = x.map((item): ListItemInfo => {
      return {
        ...item,
        addedAt: item.addedAt.toJSON(),
        updatedAt: item.updatedAt.toJSON(),
        seriesStart: item.seriesStart?.toISOString() ?? null,
        seriesEnd: item.seriesEnd?.toISOString() ?? null,
      };
    });

    if (match.length > 0) listMatch[list.internal_id] = match;
  });

  return listMatch;
};
