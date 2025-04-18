import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { ItemPrices } from '@prisma/generated/client';
import { slugify } from '../../../../utils/utils';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id as string;

  const inflation = await prisma.itemPrices.findFirst({
    where: {
      item_iid: Number(id),
      manual_check: 'inflation',
    },
  });

  const info = await prisma.itemProcess.findFirst({
    where: {
      processed: false,
      manual_check: {
        not: null,
        contains: `(${id})`,
      },
    },
  });

  return res.json({ inflation, info });
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, action, checkID, correctInfo } = req.body;
  const id = req.query.id as string;

  if (type === 'inflation') {
    const check = (await prisma.itemPrices.findFirst({
      where: {
        internal_id: checkID,
      },
    })) as ItemPrices;

    if (action === 'approve' || action === 'not_inflated') {
      const updateResult = await prisma.itemPrices.updateMany({
        where: {
          item_iid: check.item_iid,
          isLatest: true,
          addedAt: {
            lte: check.addedAt,
          },
        },
        data: {
          isLatest: null,
        },
      });

      await prisma.itemPrices.update({
        where: {
          internal_id: checkID,
        },
        data: {
          manual_check: null,
          noInflation_id: action === 'not_inflated' ? null : undefined,
          isLatest: updateResult.count > 0 || null,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'reprove') {
      const processIds = check.usedProcessIDs.split(',').map(Number);

      await prisma.itemPrices.delete({
        where: {
          internal_id: checkID,
        },
      });

      await prisma.priceProcess2.updateMany({
        where: {
          internal_id: {
            in: processIds,
          },
        },
        data: {
          processed: false,
        },
      });

      return res.json({ success: true });
    }
  }

  if (type === 'info') {
    if ((!correctInfo || !correctInfo.field || !correctInfo.value) && action !== 'reprove')
      return res.status(400).json({ error: 'Bad Request' });

    if (action === 'approve') {
      await handleItemUpdate(Number(id), correctInfo.field, correctInfo.value);

      await prisma.itemProcess.updateMany({
        where: {
          processed: false,
          manual_check: {
            contains: `(${id})`,
          },
        },
        data: {
          manual_check: null,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'reprove') {
      await prisma.itemProcess.update({
        where: {
          internal_id: checkID,
        },
        data: {
          processed: true,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'correct') {
      await prisma.itemProcess.update({
        where: {
          internal_id: checkID,
        },
        data: {
          [correctInfo.field]: correctInfo.value,
          manual_check: null,
        },
      });

      return res.json({ success: true });
    }
  }

  return res.status(400).json({ error: 'Bad Request' });
};

const handleItemUpdate = async (id: number, field: string, value: string) => {
  let itemSlug = '';

  if (field === 'name') {
    itemSlug = slugify(value);

    const dbSlugItems = await prisma.items.findMany({
      where: {
        slug: {
          startsWith: itemSlug,
        },
        NOT: {
          internal_id: Number(id),
        },
      },
    });

    if (dbSlugItems.length > 0) {
      const regex = new RegExp(`^${itemSlug}-\\d+$`);

      const sameSlug = dbSlugItems.filter((x) => regex.test(x.slug ?? ''));

      if (sameSlug.length > 0) {
        itemSlug = `${itemSlug}-${sameSlug.length + 1}`;
      }
    }
  }

  await prisma.items.update({
    where: {
      internal_id: Number(id),
    },
    data: {
      [field]: value,
      slug: itemSlug || undefined,
    },
  });
};
