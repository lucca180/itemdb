import Color from 'color';
import { NextApiRequest, NextApiResponse } from 'next';
import { Vibrant } from 'node-vibrant/node';
import { ColorType, User, UserList } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { slugify } from '../../../../../utils/utils';
import { ListService, rawToList } from '@services/ListService';

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
  const { username, officialTag } = req.query;
  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Bad Request' });

  const listService = await ListService.initReq(req);

  if (officialTag && username === 'official') {
    const result = await listService.getOfficialListsCat(officialTag as string, 3000);
    return res.status(200).json(result);
  }

  try {
    const lists = await listService.getUserLists({ username });

    return res.status(200).json(lists);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// creates a new list
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;
  const {
    name,
    description,
    coverURL,
    purpose,
    visibility,
    colorHex,
    official,
    officialTag,
    canBeLinked,
    listUserTag,
    highlight,
    highlightText,
  } = req.body;

  try {
    const { user } = await CheckAuth(req);
    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });

    if (user.username !== username && !user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    if (!name || !purpose || !visibility) return res.status(400).json({ error: 'Bad Request' });

    if (!['public', 'private', 'unlisted'].includes(visibility))
      return res.status(400).json({ error: 'Bad Request' });

    if (!['none', 'trading', 'seeking'].includes(purpose))
      return res.status(400).json({ error: 'Bad Request' });

    let colorHexVar = colorHex;

    if ((!colorHexVar || colorHexVar === '#000000') && coverURL) {
      const colors = await getImagePalette(coverURL, true).catch(() => {
        return null;
      });

      colorHexVar = colors?.vibrant.hex ?? colorHexVar;
    }

    if (/^\d+$/.test(name)) {
      return res.status(400).json({ error: 'List name cannot be a number' });
    }

    const slug = await createListSlug(name, user.id, official);

    const list = await prisma.userList.create({
      data: {
        name,
        description,
        cover_url: coverURL,
        colorHex: colorHexVar,
        official: user.isAdmin ? official : undefined,
        official_tag: officialTag,
        canBeLinked: canBeLinked ?? true, // create as true by default
        listUserTag: listUserTag ?? null,
        purpose: purpose as 'none' | 'trading' | 'seeking',
        visibility: visibility as 'public' | 'private' | 'unlisted',
        slug: slug,
        user_id: user.id,
        highlight: highlight?.trim() ?? undefined,
        highlightText: highlightText?.trim() ?? undefined,
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

// ---- COLORS ---- //

type Palette = {
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
): Promise<Record<ColorType, Palette>> => {
  if (!skipCheck) CHECK_IMG_URL(image_url);

  const palette = await Vibrant.from(image_url).getPalette();

  const colors: any = {};

  for (const [key, val] of Object.entries(palette)) {
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
  try {
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
        'imgur.com',
        'i.imgur.com',
      ].includes(hostname)
    )
      throw 'Invalid domain';

    if (!image_url.match(/\.(jpeg|jpg|gif|png)$/)) throw 'Invalid image format';
  } catch (e) {
    throw 'Invalid image URL';
  }
};

export const createListSlug = async (name: string, userId: string, isOfficial: boolean) => {
  let slug = slugify(name);

  const lists = await prisma.userList.findMany({
    where: {
      slug: slug,
      user_id: !isOfficial ? userId : undefined,
      official: isOfficial,
    },
  });

  if (lists.length === 0) return slug;

  // check if we have same slug

  const regex = new RegExp(`^${slug}(-\\d+)?$`);

  const allSlugs = [...lists.map((x) => x.slug)];

  const sameSlug = allSlugs.filter((x) => regex.test(x ?? ''));

  if (sameSlug.length > 0) {
    slug = `${slug}-${sameSlug.length + 1}`;
  }

  return slug;
};
