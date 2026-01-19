import { BattleData } from '@types';
import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'PUT') return PUT(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const data: BattleData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const itemNames = new Set<string>();

  data.attacks.map((attack) => {
    if (attack.weapon) itemNames.add(attack.weapon);
  });

  const itemData = await prisma.items.findMany({
    where: {
      name: { in: Array.from(itemNames) },
    },
    select: {
      internal_id: true,
    },
  });

  const ids = itemData.map((item) => item.internal_id);

  await prisma.bdProcess.create({
    data: {
      battle_id: data.battleId,
      battle_data: JSON.stringify(data),
      item_list: ids.toString(),
      ip_address: requestIp.getClientIp(req),
    },
  });

  return res.json({ success: true });
}

type PutRequestBody = {
  item_iid: number;
  addOrEdit?: BDDataEntry[];
  remove?: string[];
};

export type BDDataEntry = {
  type: string;
  value: string | number;
  key: string;
};

// Handle adding, editing, and removing BD effects for a specific item
async function PUT(req: NextApiRequest, res: NextApiResponse) {
  const { item_iid, addOrEdit, remove } = req.body as PutRequestBody;

  if (!item_iid || (!addOrEdit && !remove)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (addOrEdit && addOrEdit.length > 0) {
    const updatePromises = [];

    for (const entry of addOrEdit) {
      if (!entry.key) continue;
      updatePromises.push(
        prisma.bdEffects.upsert({
          where: {
            item_iid_type: {
              item_iid: item_iid,
              type: entry.key,
            },
          },
          create: {
            item_iid: item_iid,
            type: entry.key,
            value: entry.value.toString(),
          },
          update: {
            value: entry.value.toString(),
          },
        })
      );
    }

    await Promise.all(updatePromises);
  }

  if (remove && remove.length > 0) {
    await prisma.bdEffects.deleteMany({
      where: {
        item_iid: item_iid,
        type: { in: remove },
      },
    });
  }

  return res.json({ success: true });
}
