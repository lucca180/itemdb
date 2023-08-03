import Color from 'color';
import { startOfDay } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import Vibrant from 'node-vibrant';
import { ColorType, User, UserList } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);
  if (req.method === 'PUT') return PUT(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// gets all lists of a user
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, includeItems } = req.query;
  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Bad Request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const lists = await getUserLists(username, user, includeItems !== 'false');

    return res.status(200).json(lists);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// creates a new list
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  const { name, description, coverURL, purpose, visibility, colorHex, official } = req.body;

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    if (!name || !purpose || !visibility) return res.status(400).json({ error: 'Bad Request' });

    if (!['public', 'private', 'unlisted'].includes(visibility))
      return res.status(400).json({ error: 'Bad Request' });

    if (!['none', 'trading', 'seeking'].includes(purpose))
      return res.status(400).json({ error: 'Bad Request' });

    let colorHexVar = colorHex;

    if ((!colorHexVar || colorHexVar === '#000000') && coverURL) {
      const colors = await getImagePalette(coverURL);
      colorHexVar = colors.vibrant.hex;
    }

    const list = await prisma.userList.create({
      data: {
        name,
        description,
        cover_url: coverURL,
        colorHex: colorHexVar,
        official: user.isAdmin ? official : undefined,
        purpose: purpose as 'none' | 'trading' | 'seeking',
        visibility: visibility as 'public' | 'private' | 'unlisted',
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: list });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// deletes a list
const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  let listsIds = req.body.listIds;

  if (!listsIds) return res.status(400).json({ error: 'Bad Request' });
  listsIds = listsIds.map((id: string) => Number(id)) as number[];

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const result = await prisma.userList.deleteMany({
      where: {
        internal_id: {
          in: listsIds,
        },
        user_id: user.isAdmin ? undefined : user.id,
        official: user.isAdmin ? undefined : false,
      },
    });

    return res.status(200).json({ success: true, message: result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// handles list reorder
const PUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Bad Request' });

  const lists = req.body.lists as UserList[];

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const updateLists = lists.map((list) =>
      prisma.userList.update({
        where: {
          internal_id: list.internal_id,
          user_id: user.isAdmin ? undefined : user.id,
        },
        data: {
          order: list.order,
          updatedAt: new Date(),
        },
      })
    );

    const result = await prisma.$transaction(updateLists);

    return res.status(200).json({ success: true, message: result });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ----------- //

export const getUserLists = async (username: string, user?: User | null, includeItems = true) => {
  const isOfficial = username === 'official';

  const listsRaw = await prisma.userList.findMany({
    where: !isOfficial
      ? {
          visibility: user?.username === username ? undefined : 'public',
          user: {
            username: username,
          },
        }
      : {
          official: true,
        },
    include: {
      items: true,
      user: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!listsRaw || listsRaw.length === 0) return [];

  const lists: UserList[] = listsRaw
    .map((list) => {
      return {
        internal_id: list.internal_id,
        name: list.name,
        description: list.description,
        coverURL: list.cover_url,
        colorHex: list.colorHex,
        purpose: list.purpose,
        official: list.official,
        visibility: list.visibility,

        user_id: list.user_id,
        user_username: list.user.username ?? '',
        user_neouser: list.user.neo_user ?? '',

        owner: {
          id: list.user.id,
          username: list.user.username,
          neopetsUser: list.user.neo_user,
          lastSeen: startOfDay(list.user.last_login).toJSON(),
        },

        createdAt: list.createdAt.toJSON(),
        updatedAt: list.updatedAt.toJSON(),

        sortDir: list.sortDir,
        sortBy: list.sortBy,
        order: list.order ?? 0,

        itemCount: list.items.length,
        itemInfo: !includeItems
          ? []
          : list.items.map((item) => {
              return {
                internal_id: item.internal_id,
                list_id: item.list_id,
                item_iid: item.item_iid,
                addedAt: item.addedAt.toJSON(),
                updatedAt: item.updatedAt.toJSON(),
                amount: item.amount,
                capValue: item.capValue,
                imported: item.imported,
                order: item.order,
                isHighlight: item.isHighlight,
              };
            }),
      };
    })
    .sort((a, b) =>
      isOfficial
        ? new Date(b.updatedAt) < new Date(a.updatedAt)
          ? -1
          : 1
        : (a.order ?? 0) - (b.order ?? 0) ||
          (new Date(b.updatedAt) < new Date(a.updatedAt) ? -1 : 1)
    );

  return lists;
};

// ---- COLORS ---- //

type Pallete = {
  lab: number[];
  hsv: number[];
  rgb: number[];
  hex: string;
  type: string;
  population: number;
};

export const getImagePalette = async (
  image_url: string,
  skipCheck = false
): Promise<Record<ColorType, Pallete>> => {
  if (!skipCheck) CHECK_IMG_URL(image_url);

  const pallete = await Vibrant.from(image_url).getPalette();

  const colors: any = {};

  for (const [key, val] of Object.entries(pallete)) {
    const color = Color.rgb(val?.rgb ?? [255, 255, 255]);
    const lab = color.lab().round().array();
    const hsv = color.hsv().round().array();
    const hex = color.hex();

    const colorData = {
      lab: lab,
      hsv: hsv,
      rgb: color.rgb().round().array(),

      hex: hex,

      type: key.toLowerCase(),
      population: val?.population ?? 0,
    };

    colors[key.toLowerCase()] = colorData;
  }

  return colors;
};

export const CHECK_IMG_URL = (image_url: string) => {
  const domain = new URL(image_url);
  const hostname = domain.hostname;
  if (
    ![
      'itemdb.com.br',
      'magnetismotimes.com',
      'images.neopets.com',
      'pets.neopets.com',
      'neopets.com',
      'www.neopets.com',
      'uploads.neopets.com',
    ].includes(hostname)
  )
    throw 'Invalid domain';

  if (!image_url.match(/\.(jpeg|jpg|gif|png)$/)) throw 'Invalid image format';
};
