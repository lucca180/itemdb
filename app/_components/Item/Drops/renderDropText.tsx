import type { ReactNode } from 'react';
import type { ItemOpenable, PrizePoolData } from '@types';
import type { getTranslations } from 'next-intl/server';
import { isDeclaredAllPool } from '@utils/item/prizePoolName';

type TFunction = Awaited<ReturnType<typeof getTranslations>>;

function getChance(openings: number, totalOpenings: number): string {
  if (totalOpenings === 0) return '0';
  const chance = ((openings / totalOpenings) * 100).toFixed(2);
  if (chance === '100.00') return '0';
  return chance;
}

const MIN_GUARANTEED_OPENINGS = 10;

export function isGuaranteedPool(pool: PrizePoolData, itemOpenable: ItemOpenable): boolean {
  if (pool.isLE || pool.isChance || pool.name === 'bonus') return false;
  if (itemOpenable.isGBC || itemOpenable.isGram) return false;
  if (isDeclaredAllPool(pool)) return true;
  if (pool.openings < MIN_GUARANTEED_OPENINGS) return false;

  const drops = pool.items.map((id) => itemOpenable.drops[id]).filter(Boolean);
  return drops.length > 0 && drops.every((drop) => drop.dropRate >= 100);
}

export function renderDropText(
  t: TFunction,
  pool: PrizePoolData | null,
  itemOpenable: ItemOpenable,
  isFirst?: boolean
): ReactNode {
  const isGram = itemOpenable.isGram;

  if (pool && isGuaranteedPool(pool, itemOpenable)) {
    return t.rich('Drops.guaranteed', {
      b: (text) => <b>{text}</b>,
      isFirst: Boolean(isFirst).toString(),
      count: pool.items.filter((id) => itemOpenable.drops[id]).length,
    });
  }

  if (!pool || !pool.isChance || (isGram && !pool.isLE)) {
    const openable = pool ?? itemOpenable;
    const poolName = pool ? (pool.isLE ? 'le' : pool.name) : 'unknown';

    if (openable.maxDrop > 1 && openable.maxDrop !== openable.minDrop) {
      return t.rich(isGram ? 'Drops.gram-multiple' : 'Drops.multiple', {
        b: (text) => <b>{text}</b>,
        isFirst: Boolean(isFirst).toString(),
        type: poolName,
        min: openable.minDrop,
        max: openable.maxDrop,
      });
    }

    return t.rich(isGram ? 'Drops.gram-single' : 'Drops.single', {
      b: (text) => <b>{text}</b>,
      isFirst: Boolean(isFirst).toString(),
      type: poolName,
      min: openable.minDrop || openable.maxDrop,
    });
  }

  if (pool.isChance && (!isGram || pool.isLE)) {
    if (pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop) {
      return t.rich('Drops.chance-multiple', {
        b: (text) => <b>{text}</b>,
        isFirst: Boolean(isFirst).toString(),
        min: pool.minDrop,
        max: pool.maxDrop,
        type: pool.isLE ? 'le' : pool.name,
        isGram: Boolean(isGram).toString(),
        chance: pool.openings ? getChance(pool.openings, itemOpenable.openings) : 0,
      });
    }

    return t.rich('Drops.chance-single', {
      b: (text) => <b>{text}</b>,
      isFirst: Boolean(isFirst).toString(),
      min: pool.minDrop || pool.maxDrop,
      type: pool.isLE ? 'le' : pool.name,
      isGram: Boolean(isGram).toString(),
      chance: pool.openings ? getChance(pool.openings, itemOpenable.openings) : 0,
    });
  }

  return null;
}
