import prisma from '@utils/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

type BattleData = {
  battleId: number;
  result: 'win' | 'lose' | 'draw';
  attacks: BattleAttack[];
  roundLogs: {
    round: number;
    p1: {
      hp: number;
      isFrozen: boolean;
      usedFreezingAbility: boolean;
    };
    p2: {
      hp: number;
      isFrozen: boolean;
      usedFreezingAbility: boolean;
    };
  }[];
  p1: {
    stats?: {
      maxHP: number;
      agility: number;
      strength: number;
      defense: number;
    };
    name: string;
    fullHP: number;
  };
  p2: {
    name: string;
    fullHP: number;
  };
  difficulty: number;
  prizes: {
    type: 'np' | 'item';
    amount: number;
    item_id: number | null;
  };
};

type BattleAttack = {
  round: number;
  text: string;
  player: 'p1' | 'p2';
  weapon: string;
  isAbility: boolean;
  weaponMaxUses: number | null;
  damage: BattleDmg | BattleHeal | BattleDefense;
};

interface BattleDmg {
  type: string;
  label: string;
  amount: number;
}

interface BattleHeal extends BattleDmg {
  healInfo: {
    isOverHeal: boolean;
    percent: number;
  };
}

interface BattleDefense extends BattleDmg {
  defenseInfo: {
    prevDmg: number;
    percent: number;
  };
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
  console.log(data);
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
