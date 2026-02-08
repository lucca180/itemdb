import { Items } from '@prisma/generated/client';
import { BattleData, ItemData } from '@types';
import { CheckAuth } from '@utils/googleCloud';
import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { item_iid } = req.query;

  if (!item_iid) {
    return res.status(400).json({ error: 'Missing item_iid in request body' });
  }

  const itemData = await prisma.items.findUnique({
    where: { internal_id: Number(item_iid as string) },
  });

  if (!itemData) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const result = await getBDProcessData(itemData);

  if (!result) return res.status(404).json({ error: 'Insufficient data' });

  return res.json({ ...result, name: itemData.name });
}

export const getBDProcessData = async (itemData: ItemData | Items | number) => {
  if (typeof itemData === 'number') {
    itemData = (await prisma.items.findUnique({
      where: { internal_id: itemData },
    })) as Items;

    if (!itemData) return null;
  }

  const rawData = await prisma.bdProcess.findMany({
    where: {
      item_list: {
        contains: itemData.internal_id.toString(),
      },
      processed: false,
    },
  });

  const battleData = rawData.map((entry) => JSON.parse(entry.battle_data as string) as BattleData);

  const processed = processWeapon(battleData, itemData.name);
  // console.log('Processed BD Data:', processed);
  // if (processed.entries < 20) return null;

  return processed;
};

const processWeapon = (bdData: BattleData[], weapon: string) => {
  const iconMap = new Map<string, { [dmg: number]: number }>();
  let entries = 0;
  let freezeEntries = 0;
  // const maxUses = {};
  // get icons
  bdData.forEach((battle) => {
    const attacks = battle.attacks.filter((atk) => atk.weapon === weapon);
    if (!attacks.length) return;

    attacks.forEach((atk) => {
      atk.damage.forEach((dmg) => {
        // check regular icons
        const icon = (dmg.type + '_' + dmg.label).toLowerCase();

        if (!iconMap.has(icon)) {
          iconMap.set(icon, {});
        }

        iconMap.get(icon)![dmg.amount] = (iconMap.get(icon)?.[dmg.amount] || 0) + 1;

        // check heal percent
        if ('healInfo' in dmg) {
          const name = 'heal_percent';

          if (!iconMap.has(name)) {
            iconMap.set(name, {});
          }

          iconMap.get(name)![dmg.healInfo.percent] =
            (iconMap.get(name)?.[dmg.healInfo.percent] || 0) + 1;
        }
      });

      const isFreezeStr = checkFreeze(atk.text, atk.weapon);
      if (isFreezeStr) freezeEntries++;

      const nextRound = battle.roundLogs?.find((rnd) => rnd.round === atk.round + 1);
      const frozenPlayer = atk.player === 'p1' ? 'p2' : 'p1';

      if (
        nextRound &&
        !isFreezeStr &&
        nextRound[frozenPlayer].isFrozen &&
        !nextRound[atk.player].usedFreezingAbility &&
        !checkRoundFreeze(battle, atk.round, atk.player)
      ) {
        freezeEntries++;
      }

      entries++;
    });
  });

  const result: any = {};

  for (const [key, values] of iconMap.entries()) {
    const newValues: { [dmg: number]: number; range?: string } = { ...values };

    for (const [key, val] of Object.entries(newValues)) {
      if (key === 'range') continue;
      newValues[Number(key)] = ((val as number) / entries) * 100;
    }

    const [type, icon] = key.split('_') as [string, string];

    result[type] = result[type] || {};
    result[type][icon] = newValues;

    const allVals = Object.keys(newValues).map((k) => Number(k));
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    newValues.range = min === max ? `${min}` : `${min}-${max}`;
  }

  return {
    iconOccurrence: result,
    freeze: !freezeEntries
      ? null
      : {
          total: freezeEntries,
          percent: entries > 0 ? (freezeEntries / entries) * 100 : 0,
        },
    entries,
  };
};

const checkFreeze = (text: string, weapon: string) => {
  const freezingStr = ['freezing', 'freeze', 'frozen', 'stun', 'stunned'].find(
    (str) => text.toLowerCase().includes(str) && !weapon.toLowerCase().includes(str)
  );

  return Boolean(freezingStr);
};

// check if there is a confirmed freezing weapon used against this player
const checkRoundFreeze = (battle: BattleData, round: number, player: 'p1' | 'p2') => {
  const attacks = battle.attacks.filter((atk) => atk.round === round && atk.player === player);
  let isConfirmedFreeze = false;

  for (const atk of attacks) {
    isConfirmedFreeze = checkFreeze(atk.text, atk.weapon);
    if (isConfirmedFreeze) break;
  }

  return isConfirmedFreeze;
};
