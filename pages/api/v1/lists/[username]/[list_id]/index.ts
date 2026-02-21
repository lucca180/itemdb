import { NextApiRequest, NextApiResponse } from 'next';
import { createListSlug, getImagePalette } from '..';
import { ListItemInfo } from '../../../../../../types';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import prisma from '../../../../../../utils/prisma';
import { SeriesType } from '@prisma/generated/client';
import { UTCDate } from '@date-fns/utc';
import { slugify } from '@utils/utils';
import { ListService } from '@services/ListService';

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
      const updateList = itemInfo.map((item) => {
        return prisma.listItems.update({
          where: {
            internal_id: item.internal_id,
          },
          data: {
            capValue: item.capValue,
            updatedAt: new Date(),
            order: item.order,
            isHighlight: item.isHighlight,
            isHidden: item.isHidden,
            amount: item.amount,
            seriesStart: item.seriesStart
              ? new UTCDate(new UTCDate(item.seriesStart).setHours(18))
              : null,
            seriesEnd: item.seriesEnd
              ? new UTCDate(new UTCDate(item.seriesEnd).setHours(18))
              : null,
          },
        });
      });

      await prisma.$transaction(updateList);
    }

    if (itemInfo?.length && action === 'delete') {
      const ids = itemInfo.map((item) => item.internal_id);

      const deleted = await prisma.listItems.deleteMany({
        where: {
          internal_id: {
            in: ids,
          },
        },
      });

      await prisma.userList.update({
        where: {
          internal_id: Number(list_id),
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: `deleted ${deleted.count} items`,
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

      const ids = itemInfo.map((item) => item.internal_id);

      const create = prisma.listItems.createMany({
        data: itemInfo.map((item) => {
          return {
            list_id: listDest.internal_id,
            item_iid: item.item_iid,
            capValue: item.capValue,
            isHighlight: item.isHighlight,
            isHidden: item.isHidden,
            amount: item.amount,
            seriesStart: item.seriesStart,
            seriesEnd: item.seriesEnd,
          };
        }),
        skipDuplicates: true,
      });

      const update = prisma.listItems.deleteMany({
        where: {
          internal_id: {
            in: shouldDelete ? ids : [],
          },
        },
      });

      const updateList = prisma.userList.updateMany({
        where: {
          internal_id: {
            in: [listDest.internal_id, Number(shouldDelete ? list_id : -1)],
          },
        },
        data: {
          updatedAt: new Date(),
        },
      });

      const result = await prisma.$transaction([create, update, updateList]);

      return res.status(200).json({
        success: true,
        message: `moved ${result[0].count} items`,
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

  const items = req.body.items as {
    item_iid: string;
    capValue: string | undefined;
    amount: string | undefined;
    imported: boolean;
  }[];

  if (!items) return res.status(400).json({ error: 'Bad Request' });

  try {
    const { user } = await CheckAuth(req);
    if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });

    const list = await prisma.userList.findUnique({
      where: {
        internal_id: parseInt(list_id),
      },
      include: {
        items: alertDuplicates === 'true',
      },
    });

    if (!list) return res.status(400).json({ error: 'List Not Found' });

    if (list.user_id !== user.id && !(list.official && user.isAdmin))
      return res.status(403).json({ error: 'Forbidden' });

    if (alertDuplicates === 'true') {
      const itemIids = new Set(items.map((item) => parseInt(item.item_iid)));
      const hasDuplicates = list.items.filter((item) => itemIids.has(item.item_iid));

      if (hasDuplicates.length) {
        return res.status(400).json({ error: 'Duplicate Items', data: hasDuplicates });
      }
    }

    const transactions = [];

    for (const item of items) {
      const { item_iid, capValue, amount, imported } = item;

      const listItem = prisma.listItems.upsert({
        where: {
          list_id_item_iid: {
            list_id: parseInt(list_id),
            item_iid: parseInt(item_iid),
          },
        },
        create: {
          list_id: parseInt(list_id),
          item_iid: parseInt(item_iid),
          capValue: capValue ? parseInt(capValue) : undefined,
          amount: amount ? parseInt(amount) : undefined,
          imported: imported,
        },
        update: {
          list_id: parseInt(list_id),
          item_iid: parseInt(item_iid),
          capValue: capValue ? parseInt(capValue) : undefined,
          amount: amount ? parseInt(amount) : undefined,
          imported: imported,
        },
      });

      transactions.push(listItem);
    }

    const updateList = prisma.userList.update({
      where: {
        internal_id: parseInt(list_id),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const result = await prisma.$transaction([...transactions, updateList]);

    return res.status(200).json({ success: true, message: result });
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

    let operation;
    if (justHide) {
      operation = prisma.listItems.updateMany({
        where: {
          list_id: list.internal_id,
          item_iid: {
            in: item_internal_ids.map((iid) => Number(iid)),
          },
        },
        data: {
          isHidden: true,
        },
      });
    } else {
      operation = prisma.listItems.deleteMany({
        where: {
          list_id: Number(list_id),
          item_iid: {
            in: item_internal_ids.map((iid) => Number(iid)),
          },
        },
      });
    }

    const updateList = prisma.userList.update({
      where: {
        internal_id: parseInt(list_id),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await prisma.$transaction([operation, updateList]);

    return res.status(200).json({
      success: true,
      message: `deleted items`,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
