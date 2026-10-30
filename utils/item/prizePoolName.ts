/**
 * Prize pool names encode pool behavior, read by `getItemDrops`
 * (pages/api/v1/items/[id_name]/drops.ts). These helpers mirror those rules so admin UIs can
 * build a name from structured fields and show how it will be interpreted.
 */

export type PoolNameOptions = {
  base: string;
  isLE: boolean;
  isChance: boolean;
  isOld: boolean;
  isGram: boolean;
  /** Both set or both null. */
  minDrop: number | null;
  maxDrop: number | null;
  isBonus: boolean;
};

export type ParsedPoolName = {
  isLE: boolean;
  isChance: boolean;
  isOld: boolean;
  isGram: boolean;
  isBonus: boolean;
  minDrop: number | null;
  maxDrop: number | null;
};

const MIN_MAX_REGEX = /\d+-\d+/;
const FLAG_SEGMENTS = ['le', 'chance', 'gram'];

/** Bare pool name meaning every item of the pool is granted. */
export const ALL_ITEMS_POOL = 'normal';

export const emptyPoolNameOptions: PoolNameOptions = {
  base: '',
  isLE: false,
  isChance: false,
  isOld: false,
  isGram: false,
  minDrop: null,
  maxDrop: null,
  isBonus: false,
};

export const slugifyPoolBase = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/** Same checks `getItemDrops` runs on a (lowercased) pool name. */
export const parsePoolName = (rawName: string): ParsedPoolName => {
  const name = rawName.toLowerCase();
  const minMax = name.match(MIN_MAX_REGEX)?.[0];
  const [minDrop, maxDrop] = minMax ? minMax.split('-').map(Number) : [null, null];

  return {
    isLE: name.split('-').includes('le'),
    isChance: name.includes('chance'),
    isOld: name.includes('old-'),
    isGram: name.includes('gram'),
    isBonus: name === 'bonus',
    minDrop,
    maxDrop,
  };
};

/**
 * Pools whose name states that every item drops: bare `normal`, or a fixed `N-N` range where N is
 * the pool's item count. These don't need opening data to be shown as guaranteed.
 */
export const isDeclaredAllPool = (pool: { name: string; items: number[] }) => {
  const name = pool.name.toLowerCase();
  if (name === ALL_ITEMS_POOL) return true;

  const parsed = parsePoolName(name);
  if (parsed.isLE || parsed.isChance || parsed.isGram || parsed.isBonus) return false;

  const itemCount = new Set(pool.items).size;
  return parsed.minDrop === parsed.maxDrop && parsed.minDrop === itemCount && itemCount > 0;
};

/**
 * Builds `[old]-[min-max]-[base]-[gram]-[chance]-[le]`. min-max goes before the base so a base
 * ending in a digit (e.g. `cat1`) can't be read as part of the range.
 */
export const composePoolName = (options: PoolNameOptions) => {
  if (options.isBonus) return 'bonus';

  const parts: string[] = [];
  const base = slugifyPoolBase(options.base);

  if (options.isOld) parts.push('old');
  if (options.minDrop !== null && options.maxDrop !== null)
    parts.push(`${options.minDrop}-${options.maxDrop}`);
  if (base) parts.push(base);
  if (options.isGram) parts.push('gram');
  if (options.isChance) parts.push('chance');
  if (options.isLE) parts.push('le');

  return parts.join('-');
};

/** Inverse of `composePoolName`, used to load an existing pool into the form. */
export const decomposePoolName = (rawName: string): PoolNameOptions => {
  const name = slugifyPoolBase(rawName);
  if (name === 'bonus') return { ...emptyPoolNameOptions, isBonus: true };

  const parsed = parsePoolName(name);
  let rest = name.replace(/^old-/, '');
  const minMax = rest.match(MIN_MAX_REGEX)?.[0];
  if (minMax) rest = rest.replace(minMax, '');

  return {
    ...parsed,
    base: rest
      .split('-')
      .filter((part) => part && !FLAG_SEGMENTS.includes(part))
      .join('-'),
  };
};

/** Returns a form error, or null when the options can be submitted. */
export const validatePoolNameOptions = (options: PoolNameOptions) => {
  if (options.isBonus) return null;
  if (!slugifyPoolBase(options.base) && !options.isLE) return 'Enter a pool name';
  if ((options.minDrop === null) !== (options.maxDrop === null))
    return 'Fill both min and max, or leave both empty';
  if (options.minDrop !== null && options.maxDrop !== null && options.minDrop > options.maxDrop)
    return "Min can't be greater than max";
  return null;
};

/** Flags the base name would trigger by accident. */
export const getPoolNameWarnings = (options: PoolNameOptions) => {
  if (options.isBonus) return [];

  const base = slugifyPoolBase(options.base);
  if (!base) return [];

  const parsed = parsePoolName(base);
  const warnings: string[] = [];

  if (parsed.isGram && !options.isGram)
    warnings.push(`"${base}" contains "gram": the whole item becomes a gram (1 fixed drop)`);
  if (parsed.isChance && !options.isChance)
    warnings.push(`"${base}" contains "chance": the pool becomes a chance pool`);
  if (parsed.isLE && !options.isLE)
    warnings.push(`"${base}" has a "le" segment: the pool becomes LE`);
  if (parsed.isOld && !options.isOld)
    warnings.push(`"${base}" contains "old-": the pool moves to old pools`);
  if (parsed.minDrop !== null && options.minDrop === null)
    warnings.push(
      `"${base}" contains "${parsed.minDrop}-${parsed.maxDrop}": read as min/max drops`
    );
  if (composePoolName(options) === ALL_ITEMS_POOL)
    warnings.push(`"${ALL_ITEMS_POOL}" without min/max: every item of the pool is granted`);

  return warnings;
};
