import { NextApiRequest, NextApiResponse } from 'next';
import { createListSlug, getImagePalette } from '..';
import { ListItemInfo } from '../../../../../../types';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import prisma from '../../../../../../utils/prisma';
import { SeriesType } from '@prisma/generated/client';
import { UTCDate } from '@date-fns/utc';
import { slugify } from '@utils/utils';
import { ListService, type PutListItemInput } from '@services/ListService';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'PUT') return PUT(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// get a list
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id: list_id_or_slug } = req.query;
  const isOfficial = username === 'official';

  if (!username || !list_id_or_slug || Array.isArray(username) || Array.isArray(list_id_or_slug))
    return res.status(400).json({ error: 'Bad Request' });

  try {
    const listService = await ListService.initReq(req);

    const list = await listService.getList({
      username: username,
      list_id_or_slug: list_id_or_slug,
      isOfficial: isOfficial,
    });

    return res.status(200).json(list);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// updates a list / move items to another list / delete items
const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { list_id } = req.query;
  const action = req.body.action ?? 'update';

  if (!list_id || Array.isArray(list_id)) return res.status(400).json({ error: 'Bad Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: Number(list_id),
      },
    });

    if (!list) return res.status(404).json({ error: 'List not found' });

    if (list.user_id !== user.id && !user.isAdmin)
      return res.status(401).json({ error: 'Unauthorized' });

    const itemInfo = req.body.itemInfo as ListItemInfo[];

    if (itemInfo?.length && action === 'update') {
      await ListService.updateItems(Number(list_id), itemInfo);
    }

    if (itemInfo?.length && action === 'delete') {
      const deleteResult = await ListService.deleteItemsByInternalId(
        Number(list_id),
        itemInfo.map((item) => item.internal_id)
      );

      return res.status(200).json({
        success: true,
        message: `deleted ${deleteResult.count} items`,
      });
    }

    if (itemInfo?.length && (action === 'move' || action === 'copy')) {
      const shouldDelete = action === 'move';
      const listDestId = req.body.listDestId as string;

      if (!listDestId) return res.status(400).json({ error: 'listDestId is required' });

      const listDest = await prisma.userList.findUnique({
        where: {
          internal_id: Number(listDestId),
        },
      });

      if (!listDest) return res.status(400).json({ error: 'List not found' });

      if (listDest.user_id !== user.id && !user.isAdmin)
        return res.status(401).json({ error: 'Unauthorized' });

      const result = await ListService.moveOrCopyItems({
        sourceListId: Number(list_id),
        destListId: listDest.internal_id,
        items: itemInfo,
        move: shouldDelete,
      });

      return res.status(200).json({
        success: true,
        message: `moved ${result.count} items`,
      });
    }

    // ----------------  UPDATE LIST ------------------ //

    const {
      name,
      description,
      coverURL,
      purpose,
      visibility,
      colorHex,
      official,
      sortInfo,
      order,
      officialTag,
      seriesType,
      seriesStart,
      seriesEnd,
      listUserTag,
      canBeLinked,
      highlight,
      highlightText,
    } = req.body as {
      name?: string;
      description?: string;
      coverURL?: string;
      purpose?: 'none' | 'trading' | 'seeking';
      visibility?: 'public' | 'private' | 'unlisted';
      colorHex?: string;
      official?: boolean;
      order?: string;
      officialTag?: string;
      sortInfo?: { sortBy: string; sortDir: string };
      seriesType?: string;
      seriesStart?: string;
      seriesEnd?: string;
      listUserTag?: string;
      canBeLinked?: boolean;
      highlight?: string;
      highlightText?: string;
    };

    if (
      name ||
      description ||
      coverURL ||
      purpose ||
      visibility ||
      colorHex ||
      official ||
      sortInfo ||
      order ||
      officialTag ||
      seriesType ||
      seriesStart ||
      seriesEnd ||
      listUserTag ||
      canBeLinked ||
      highlight ||
      highlightText
    ) {
      let colorHexVar = colorHex;

      if ((!colorHexVar || colorHexVar === '#000000') && coverURL) {
        const colors = await getImagePalette(coverURL);
        colorHexVar = colors.vibrant.hex;
      }

      let slug = list.slug;
      // update slug
      if (
        (name && slugify(name) !== list.slug) ||
        (typeof official !== 'undefined' && list.official !== official)
      ) {
        if (/^\d+$/.test(name ?? list.name)) {
          return res.status(400).json({ error: 'List name cannot be a number' });
        }

        slug = await createListSlug(name ?? list.name, user.id, !!official);
      }

      await prisma.userList.update({
        where: {
          internal_id: Number(list_id),
        },
        data: {
          name,
          description,
          updatedAt: new Date(),
          cover_url: coverURL,
          colorHex: colorHexVar,
          official: user.isAdmin ? official : undefined,
          order: order ? Number(order) : undefined,
          purpose: purpose,
          visibility: visibility,
          official_tag: officialTag,
          sortBy: sortInfo?.sortBy,
          sortDir: sortInfo?.sortDir,
          listUserTag: listUserTag ?? null,
          canBeLinked: canBeLinked ?? undefined,
          seriesType: seriesType === 'none' ? null : (seriesType as SeriesType),
          seriesStart: seriesStart ? new UTCDate(new UTCDate(seriesStart).setHours(18)) : null,
          seriesEnd: seriesEnd ? new UTCDate(new UTCDate(seriesEnd).setHours(18)) : null,
          slug: slug,
          highlight: highlight?.trim() ?? undefined,
          highlightText: highlightText?.trim() ?? undefined,
        },
      });
    }

    return res.status(200).json({ success: true, message: 'list updated' });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// add item to list
const PUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id, alertDuplicates } = req.query;

  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id))
    return res.status(400).json({ error: 'Bad Request' });

  const items = req.body.items as PutListItemInput[];

  if (!items) return res.status(400).json({ error: 'Bad Request' });

  try {
    const parsedListId = Number(list_id);

    const { user } = await CheckAuth(req);
    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: parsedListId,
      },
      include: {
        items: alertDuplicates === 'true',
      },
    });

    if (!list) return res.status(400).json({ error: 'List Not Found' });

    if (list.user_id !== user.id && !(list.official && user.isAdmin))
      return res.status(403).json({ error: 'Forbidden' });

    if (alertDuplicates === 'true') {
      const itemIids = new Set(items.map((item) => Number(item.item_iid)));
      const hasDuplicates = list.items.filter((item) => itemIids.has(item.item_iid));

      if (hasDuplicates.length) {
        return res.status(400).json({ error: 'Duplicate Items', data: hasDuplicates });
      }
    }
    await ListService.upsertItems(parsedListId, items);

    return res.status(200).json({ success: true, message: 'items upserted' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { list_id, hide } = req.query;
  if (!list_id || Array.isArray(list_id)) return res.status(400).json({ error: 'Bad Request' });

  let justHide = hide === 'true';

  try {
    const { user } = await CheckAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: Number(list_id),
      },
    });

    if (!list) return res.status(400).json({ error: 'List not found' });

    if (list.user_id !== user.id && !user.isAdmin)
      return res.status(401).json({ error: 'Unauthorized' });

    const item_internal_ids = req.body.item_iid as string[];

    if (!item_internal_ids || !item_internal_ids.length)
      return res.status(400).json({ error: 'Bad Request' });

    if (list.dynamicType === 'fullSync') justHide = true;

    if (justHide) {
      await ListService.hideItems(
        list.internal_id,
        item_internal_ids.map((iid) => Number(iid))
      );
    } else {
      await ListService.removeItems(
        Number(list_id),
        item_internal_ids.map((iid) => Number(iid))
      );
    }

    return res.status(200).json({
      success: true,
      message: `deleted items`,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
